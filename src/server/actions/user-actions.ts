"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, assertCompanyAccess } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserRole } from "@prisma/client";
import { sendEmail, inviteUserEmail, emailConfigured } from "@/lib/email";

const userSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  email: z.string().email("E-mail inválido."),
  role: z.nativeEnum(UserRole),
  companyIds: z.array(z.string().uuid()).default([]),
  propertyIds: z.array(z.string().uuid()).default([]),
});

export type UserInput = z.infer<typeof userSchema>;

const updateUserSchema = userSchema.omit({ email: true });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Cria um usuário e convida-o por e-mail. Quando RESEND_API_KEY está
 * configurado, o e-mail de convite é enviado de verdade. Sem provedor
 * configurado, o link de definição de senha é retornado diretamente para
 * exibição em tela (nunca "enviado" de fato) — mesma lógica de
 * `requestPasswordReset`.
 */
export async function inviteUser(input: UserInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "user:manage");
  const data = userSchema.parse(input);

  if (session.user.role !== "SUPERADMIN" && data.role === "SUPERADMIN") {
    throw new Error("Apenas um superadministrador pode criar outro superadministrador.");
  }
  if (session.user.role !== "SUPERADMIN") {
    if (data.companyIds.length === 0) {
      throw new Error("Selecione ao menos uma empresa para o novo usuário.");
    }
    for (const companyId of data.companyIds) {
      assertCompanyAccess(session, companyId);
    }
  }
  if (data.propertyIds.length > 0) {
    const properties = await prisma.property.findMany({ where: { id: { in: data.propertyIds } } });
    const foreign = properties.find((p) => !data.companyIds.includes(p.companyId));
    if (foreign) {
      throw new Error("Um empreendimento selecionado não pertence a nenhuma das empresas escolhidas.");
    }
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (existing) {
    throw new Error("Já existe um usuário com este e-mail.");
  }

  const randomPassword = crypto.randomBytes(24).toString("hex");
  const passwordHash = await bcrypt.hash(randomPassword, 12);
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: data.role,
      passwordResetTokenHash: resetTokenHash,
      passwordResetExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 72),
      companies: { create: data.companyIds.map((companyId) => ({ companyId })) },
      propertyAccess: { create: data.propertyIds.map((propertyId) => ({ propertyId })) },
    },
  });

  await recordAudit({
    userId: session.user.id,
    action: "CRIACAO",
    entity: "User",
    entityId: user.id,
    newData: { name: data.name, email: data.email, role: data.role },
  });

  revalidatePath("/usuarios");

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/redefinir-senha/${resetToken}`;

  if (emailConfigured) {
    const result = await sendEmail({
      to: user.email,
      subject: `Convite — ${data.name}`,
      html: inviteUserEmail({ name: data.name, inviteUrl }),
    });
    return { user, inviteUrl: result.sent ? null : inviteUrl, emailConfigured, emailError: result.sent ? null : result.error };
  }

  return { user, inviteUrl, emailConfigured, emailError: null };
}

export async function updateUserRoleAndAccess(userId: string, input: UpdateUserInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "user:manage");
  const data = updateUserSchema.parse(input);

  const existing = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { companies: true } });

  if (session.user.role !== "SUPERADMIN") {
    if (existing.role === "SUPERADMIN" || data.role === "SUPERADMIN") {
      throw new Error("Apenas um superadministrador pode gerenciar contas de superadministrador.");
    }
    const targetIsAccessible = existing.companies.some((c) => session.user.companyIds.includes(c.companyId));
    if (!targetIsAccessible) {
      throw new Error("Você não tem acesso a este usuário.");
    }
    if (data.companyIds.length === 0) {
      throw new Error("Selecione ao menos uma empresa para o usuário.");
    }
    for (const companyId of data.companyIds) {
      assertCompanyAccess(session, companyId);
    }
  }
  if (data.propertyIds.length > 0) {
    const properties = await prisma.property.findMany({ where: { id: { in: data.propertyIds } } });
    const foreign = properties.find((p) => !data.companyIds.includes(p.companyId));
    if (foreign) {
      throw new Error("Um empreendimento selecionado não pertence a nenhuma das empresas escolhidas.");
    }
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { name: data.name, role: data.role } }),
    prisma.userCompany.deleteMany({ where: { userId } }),
    prisma.userCompany.createMany({ data: data.companyIds.map((companyId) => ({ userId, companyId })) }),
    prisma.userProperty.deleteMany({ where: { userId } }),
    prisma.userProperty.createMany({ data: data.propertyIds.map((propertyId) => ({ userId, propertyId })) }),
  ]);

  await recordAudit({
    userId: session.user.id,
    action: "ALTERACAO_PERMISSOES",
    entity: "User",
    entityId: userId,
    previousData: { role: existing.role },
    newData: { role: data.role, companyIds: data.companyIds, propertyIds: data.propertyIds },
  });

  revalidatePath("/usuarios");
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const session = await requireSession();
  requirePermission(session.user.role, "user:manage");

  if (session.user.role !== "SUPERADMIN") {
    const existing = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { companies: true } });
    if (existing.role === "SUPERADMIN") {
      throw new Error("Apenas um superadministrador pode gerenciar contas de superadministrador.");
    }
    const targetIsAccessible = existing.companies.some((c) => session.user.companyIds.includes(c.companyId));
    if (!targetIsAccessible) {
      throw new Error("Você não tem acesso a este usuário.");
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { isActive } });

  await recordAudit({
    userId: session.user.id,
    action: "ALTERACAO",
    entity: "User",
    entityId: userId,
    newData: { isActive },
  });

  revalidatePath("/usuarios");
}
