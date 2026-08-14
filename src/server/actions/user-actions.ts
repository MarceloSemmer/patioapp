"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserRole } from "@prisma/client";

const EMAIL_CONFIGURED = Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY);

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
 * Cria um usuário e convida-o por e-mail. Sem provedor de e-mail configurado
 * neste ambiente de demonstração, o link de definição de senha é retornado
 * diretamente para exibição em tela (nunca "enviado" de fato) — mesma lógica
 * de `requestPasswordReset`.
 */
export async function inviteUser(input: UserInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "user:manage");
  const data = userSchema.parse(input);

  if (session.user.role !== "SUPERADMIN" && data.role === "SUPERADMIN") {
    throw new Error("Apenas um superadministrador pode criar outro superadministrador.");
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
  return { user, inviteUrl: EMAIL_CONFIGURED ? null : inviteUrl, emailConfigured: EMAIL_CONFIGURED };
}

export async function updateUserRoleAndAccess(userId: string, input: UpdateUserInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "user:manage");
  const data = updateUserSchema.parse(input);

  const existing = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

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
