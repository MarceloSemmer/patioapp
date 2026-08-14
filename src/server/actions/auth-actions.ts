"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { requireSession } from "@/lib/session";
import { z } from "zod";

const EMAIL_CONFIGURED = Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY);

/**
 * Solicita redefinição de senha. Este ambiente de demonstração não possui
 * um provedor de e-mail configurado (SMTP_HOST ou RESEND_API_KEY ausentes),
 * então — em vez de simular um envio que não ocorre — o link de redefinição
 * é retornado diretamente para exibição em tela, apenas para uso local/demo.
 * Em produção, com um provedor configurado, o link deve ser enviado por e-mail
 * e nunca exibido na resposta.
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Resposta genérica sempre, para não revelar se o e-mail existe.
  const genericResult = {
    ok: true,
    message: "Se o e-mail existir em nossa base, um link de redefinição foi gerado.",
    devResetUrl: null as string | null,
    emailConfigured: EMAIL_CONFIGURED,
  };

  if (!user || !user.isActive || user.deletedAt) {
    return genericResult;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1h
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/redefinir-senha/${token}`;

  if (EMAIL_CONFIGURED) {
    // Estrutura preparada para integração futura com provedor de e-mail.
    // TODO: enviar `resetUrl` via provedor configurado (SMTP ou Resend).
    return { ...genericResult, devResetUrl: null };
  }

  return { ...genericResult, devResetUrl: resetUrl };
}

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
});

export async function resetPassword(input: { token: string; password: string }) {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    return { ok: false, message: "Link inválido ou expirado. Solicite uma nova redefinição." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      failedLoginCount: 0,
    },
  });

  return { ok: true, message: "Senha redefinida com sucesso. Você já pode entrar." };
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "A nova senha deve ter ao menos 8 caracteres."),
});

export async function changeOwnPassword(input: { currentPassword: string; newPassword: string }) {
  const session = await requireSession();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, message: "Senha atual incorreta." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { ok: true, message: "Senha alterada com sucesso." };
}
