"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, assertCompanyAccess } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const leadSchema = z.object({
  propertyId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  stageId: z.string().uuid(),
  contactName: z.string().min(2, "Informe o nome do contato."),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  segmentDesired: z.string().optional().nullable(),
  desiredArea: z.coerce.number().optional().nullable(),
  budgetMin: z.coerce.number().optional().nullable(),
  budgetMax: z.coerce.number().optional().nullable(),
  ownerUserId: z.string().uuid().optional().nullable(),
  nextActivityAt: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export async function createLead(input: LeadInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "crm:manage");
  const data = leadSchema.parse(input);

  const stage = await prisma.pipelineStage.findUniqueOrThrow({ where: { id: data.stageId } });
  assertCompanyAccess(session, stage.companyId);

  if (data.propertyId) {
    const property = await prisma.property.findUniqueOrThrow({ where: { id: data.propertyId } });
    if (property.companyId !== stage.companyId) {
      throw new Error("O empreendimento informado não pertence à mesma empresa do funil selecionado.");
    }
  }

  const lead = await prisma.lead.create({ data });

  await recordAudit({
    companyId: stage.companyId,
    userId: session.user.id,
    action: "CRIACAO",
    entity: "Lead",
    entityId: lead.id,
    newData: data,
  });

  revalidatePath("/crm");
  return lead;
}

export async function moveLeadStage(leadId: string, stageId: string) {
  const session = await requireSession();
  requirePermission(session.user.role, "crm:manage");

  const existingLead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId }, include: { stage: true } });
  assertCompanyAccess(session, existingLead.stage.companyId);

  const stage = await prisma.pipelineStage.findUniqueOrThrow({ where: { id: stageId } });
  if (stage.companyId !== existingLead.stage.companyId) {
    throw new Error("Não é possível mover o lead para uma etapa de outra empresa.");
  }

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      stageId,
      status: stage.isWon ? "GANHO" : stage.isLost ? "PERDIDO" : "ABERTO",
    },
  });

  await recordAudit({
    companyId: stage.companyId,
    userId: session.user.id,
    action: "ALTERACAO_STATUS",
    entity: "Lead",
    entityId: leadId,
    newData: { stageId },
  });

  revalidatePath("/crm");
  return lead;
}

const activitySchema = z.object({
  leadId: z.string().uuid(),
  type: z.string().min(1),
  description: z.string().min(1),
  dueAt: z.coerce.date().optional().nullable(),
});

export async function addLeadActivity(input: z.infer<typeof activitySchema>) {
  const session = await requireSession();
  requirePermission(session.user.role, "crm:manage");
  const data = activitySchema.parse(input);

  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: data.leadId }, include: { stage: true } });
  assertCompanyAccess(session, lead.stage.companyId);

  const activity = await prisma.leadActivity.create({ data: { ...data, userId: session.user.id } });
  revalidatePath("/crm");
  return activity;
}

export async function markLeadLost(leadId: string, reason: string) {
  const session = await requireSession();
  requirePermission(session.user.role, "crm:manage");

  const existingLead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId }, include: { stage: true } });
  assertCompanyAccess(session, existingLead.stage.companyId);

  const lostStage = await prisma.pipelineStage.findFirst({ where: { isLost: true, companyId: existingLead.stage.companyId } });
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: { status: "PERDIDO", lossReason: reason, ...(lostStage ? { stageId: lostStage.id } : {}) },
  });

  revalidatePath("/crm");
  return lead;
}
