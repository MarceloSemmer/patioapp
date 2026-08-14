"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";

async function nextProtocol() {
  const count = await prisma.maintenanceTicket.count();
  const year = new Date().getFullYear();
  return `CH-${year}-${String(count + 1).padStart(5, "0")}`;
}

const ticketSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional().nullable(),
  tenantId: z.string().uuid().optional().nullable(),
  category: z.nativeEnum(TicketCategory),
  priority: z.nativeEnum(TicketPriority).default("MEDIA"),
  title: z.string().min(2, "Informe um título."),
  description: z.string().min(2, "Descreva o chamado."),
  vendorName: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  estimatedCost: z.coerce.number().optional().nullable(),
});

export type TicketInput = z.infer<typeof ticketSchema>;

export async function createTicket(input: TicketInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "maintenance:manage");
  const data = ticketSchema.parse(input);

  const property = await prisma.property.findUniqueOrThrow({ where: { id: data.propertyId } });
  const protocol = await nextProtocol();

  const ticket = await prisma.maintenanceTicket.create({
    data: { ...data, protocol, requestedByUserId: session.user.id, status: "ABERTO" },
  });

  await recordAudit({
    companyId: property.companyId,
    userId: session.user.id,
    action: "CRIACAO",
    entity: "MaintenanceTicket",
    entityId: ticket.id,
    newData: data,
  });

  revalidatePath("/manutencao");
  return ticket;
}

const tenantTicketSchema = z.object({
  unitId: z.string().uuid().optional().nullable(),
  category: z.nativeEnum(TicketCategory),
  priority: z.nativeEnum(TicketPriority).default("MEDIA"),
  title: z.string().min(2, "Informe um título."),
  description: z.string().min(2, "Descreva o chamado."),
});

/**
 * Abertura de chamado pelo próprio locatário no portal. O empreendimento e a
 * unidade são derivados do contrato ativo do locatário autenticado — nunca
 * aceitos como entrada livre — para impedir abertura de chamados em nome de
 * unidades de outros locatários.
 */
export async function createTenantTicket(input: z.infer<typeof tenantTicketSchema>) {
  const session = await requireSession();
  if (session.user.role !== "LOCATARIO" || !session.user.tenantId) {
    throw new Error("Acesso negado.");
  }
  const data = tenantTicketSchema.parse(input);

  const contract = await prisma.contract.findFirst({
    where: { tenantId: session.user.tenantId, status: { in: ["ATIVO", "EM_CARENCIA", "PROXIMO_VENCIMENTO"] } },
    include: { units: true },
  });
  if (!contract) {
    throw new Error("Nenhum contrato ativo encontrado para abertura de chamado.");
  }

  const allowedUnitIds = contract.units.map((u) => u.unitId);
  if (data.unitId && !allowedUnitIds.includes(data.unitId)) {
    throw new Error("Unidade inválida para este contrato.");
  }

  const protocol = await nextProtocol();
  const ticket = await prisma.maintenanceTicket.create({
    data: {
      propertyId: contract.propertyId,
      unitId: data.unitId ?? allowedUnitIds[0] ?? null,
      tenantId: session.user.tenantId,
      requestedByUserId: session.user.id,
      category: data.category,
      priority: data.priority,
      title: data.title,
      description: data.description,
      protocol,
      status: "ABERTO",
    },
  });

  revalidatePath("/portal/chamados");
  revalidatePath("/manutencao");
  return ticket;
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus, message?: string) {
  const session = await requireSession();
  requirePermission(session.user.role, "maintenance:manage");

  const existing = await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id: ticketId }, include: { property: true } });

  const ticket = await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceTicket.update({
      where: { id: ticketId },
      data: { status, closedAt: status === "CONCLUIDO" || status === "CANCELADO" ? new Date() : null },
    });
    await tx.ticketUpdate.create({
      data: { ticketId, userId: session.user.id, message: message || `Status alterado para ${status}.`, newStatus: status },
    });
    return updated;
  });

  await recordAudit({
    companyId: existing.property.companyId,
    userId: session.user.id,
    action: "ALTERACAO_STATUS",
    entity: "MaintenanceTicket",
    entityId: ticketId,
    previousData: { status: existing.status },
    newData: { status },
  });

  revalidatePath("/manutencao");
  return ticket;
}

const assignSchema = z.object({
  ticketId: z.string().uuid(),
  assignedToUserId: z.string().uuid().optional().nullable(),
  vendorName: z.string().optional().nullable(),
});

export async function assignTicket(input: z.infer<typeof assignSchema>) {
  const session = await requireSession();
  requirePermission(session.user.role, "maintenance:manage");
  const data = assignSchema.parse(input);

  const ticket = await prisma.maintenanceTicket.update({
    where: { id: data.ticketId },
    data: { assignedToUserId: data.assignedToUserId, vendorName: data.vendorName },
  });

  revalidatePath("/manutencao");
  return ticket;
}
