import { Resend } from "resend";
import { appConfig } from "@/config/app";

/**
 * Envio de e-mail transacional.
 *
 * Ativo automaticamente quando RESEND_API_KEY está configurado (usa
 * https://resend.com). Sem a chave, `sendEmail` retorna `{ sent: false }` e
 * o chamador deve tratar isso mostrando a informação em tela em vez de
 * fingir que um e-mail foi enviado — nunca simulamos um envio que não
 * ocorreu de verdade.
 */

export const emailConfigured = Boolean(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || `${appConfig.systemName} <nao-responda@patiogestor.demo>`;

let resendClient: Resend | null = null;
function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<{ sent: boolean; error?: string }> {
  if (!emailConfigured) {
    return { sent: false, error: "Nenhum provedor de e-mail configurado (RESEND_API_KEY ausente)." };
  }

  try {
    const client = getResendClient();
    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      return { sent: false, error: error.message };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "Falha desconhecida ao enviar e-mail." };
  }
}

function emailShell(title: string, bodyHtml: string) {
  return `
    <div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <div style="background:#1e3a8a; color:#fff; padding:16px 24px; border-radius:8px 8px 0 0;">
        <strong style="font-size:16px;">${appConfig.systemName}</strong>
      </div>
      <div style="border:1px solid #e5e7eb; border-top:none; padding:24px; border-radius:0 0 8px 8px;">
        <h2 style="margin-top:0; font-size:18px;">${title}</h2>
        ${bodyHtml}
        <p style="margin-top:24px; font-size:12px; color:#6b7280;">
          ${appConfig.demoModeLabel}
        </p>
      </div>
    </div>
  `;
}

export function inviteUserEmail(params: { name: string; inviteUrl: string }) {
  return emailShell(
    "Você foi convidado(a)",
    `<p>Olá, ${params.name}!</p>
     <p>Você foi convidado(a) para acessar o ${appConfig.systemName}. Clique no link abaixo para definir sua senha:</p>
     <p><a href="${params.inviteUrl}" style="color:#1e3a8a;">${params.inviteUrl}</a></p>`,
  );
}

export function passwordResetEmail(params: { resetUrl: string }) {
  return emailShell(
    "Redefinição de senha",
    `<p>Recebemos uma solicitação de redefinição de senha para sua conta no ${appConfig.systemName}.</p>
     <p>Se foi você, clique no link abaixo (válido por 1 hora):</p>
     <p><a href="${params.resetUrl}" style="color:#1e3a8a;">${params.resetUrl}</a></p>
     <p>Se não foi você, ignore este e-mail.</p>`,
  );
}
