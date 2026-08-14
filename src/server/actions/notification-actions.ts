"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { appConfig } from "@/config/app";
import { addDays } from "date-fns";

export async function markNotificationRead(id: string) {
  const session = await requireSession();
  await prisma.notification.updateMany({ where: { id, userId: session.user.id }, data: { isRead: true } });
  revalidatePath("/notificacoes");
}

export async function markAllNotificationsRead() {
  const session = await requireSession();
  await prisma.notification.updateMany({ where: { userId: session.user.id, isRead: false }, data: { isRead: true } });
  revalidatePath("/notificacoes");
}

/**
 * Gera notificações internas a partir de regras de negócio (contratos a
 * vencer, cobranças vencidas, documentos vencendo, chamados atrasados).
 *
 * Em produção isso deve rodar em um job agendado; aqui é chamado sob demanda
 * ao abrir a central de notificações, o que é suficiente para a demonstração
 * mas não substitui um agendador real. Envio por e-mail/WhatsApp/SMS/push
 * está preparado na estrutura (NotificationType) mas não é executado nesta
 * versão — apenas notificações internas são geradas, nunca um envio externo
 * simulado sem credenciais configuradas.
 */
export async function generateSystemNotifications(companyId: string, userId: string) {
  const now = new Date();
  const notifications: { type: string; title: string; message: string; linkUrl: string }[] = [];

  const contracts = await prisma.contract.findMany({
    where: {
      deletedAt: null,
      property: { companyId },
      status: { in: ["ATIVO", "EM_CARENCIA", "PROXIMO_VENCIMENTO"] },
      endDate: { gte: now, lte: addDays(now, Math.max(...appConfig.contractExpiryAlertDays)) },
    },
    include: { tenant: { select: { name: true } } },
  });
  for (const c of contracts) {
    notifications.push({
      type: "CONTRATO_VENCENDO",
      title: `Contrato ${c.number} próximo do vencimento`,
      message: `O contrato de ${c.tenant.name} vence em ${c.endDate.toLocaleDateString("pt-BR")}.`,
      linkUrl: `/contratos/${c.id}`,
    });
  }

  const overdueCharges = await prisma.charge.findMany({
    where: { status: "VENCIDA", contract: { property: { companyId } } },
    include: { contract: { select: { number: true, id: true, tenant: { select: { name: true } } } } },
    take: 20,
  });
  for (const charge of overdueCharges) {
    notifications.push({
      type: "COBRANCA_VENCIDA",
      title: `Cobrança vencida — ${charge.contract.tenant.name}`,
      message: `Contrato ${charge.contract.number} possui cobrança vencida em ${charge.dueDate.toLocaleDateString("pt-BR")}.`,
      linkUrl: `/financeiro?contrato=${charge.contract.id}`,
    });
  }

  const expiringDocs = await prisma.document.findMany({
    where: { companyId, expiresAt: { gte: now, lte: addDays(now, 30) } },
  });
  for (const doc of expiringDocs) {
    notifications.push({
      type: "DOCUMENTO_VENCENDO",
      title: `Documento vencendo — ${doc.title}`,
      message: `O documento vence em ${doc.expiresAt!.toLocaleDateString("pt-BR")}.`,
      linkUrl: `/documentos`,
    });
  }

  const overdueTickets = await prisma.maintenanceTicket.findMany({
    where: { property: { companyId }, status: { notIn: ["CONCLUIDO", "CANCELADO"] }, dueDate: { lt: now } },
  });
  for (const ticket of overdueTickets) {
    notifications.push({
      type: "CHAMADO_ATRASADO",
      title: `Chamado atrasado — ${ticket.protocol}`,
      message: `O chamado "${ticket.title}" está com o prazo vencido.`,
      linkUrl: `/manutencao`,
    });
  }

  for (const n of notifications) {
    const exists = await prisma.notification.findFirst({
      where: { userId, companyId, title: n.title, isRead: false },
    });
    if (!exists) {
      await prisma.notification.create({
        data: { companyId, userId, type: n.type as never, title: n.title, message: n.message, linkUrl: n.linkUrl },
      });
    }
  }
}
