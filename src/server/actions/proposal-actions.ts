"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, assertCompanyAccess, assertPropertyAccess } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { AdjustmentIndexType, GuaranteeType, ProposalStatus } from "@prisma/client";

const proposalSchema = z.object({
  propertyId: z.string().uuid(),
  tenantId: z.string().uuid(),
  leadId: z.string().uuid().optional().nullable(),
  unitIds: z.array(z.string().uuid()).min(1, "Selecione ao menos uma unidade."),
  totalArea: z.coerce.number().positive(),
  rentValue: z.coerce.number().positive(),
  condoFee: z.coerce.number().optional().nullable(),
  iptuFee: z.coerce.number().optional().nullable(),
  promoFundFee: z.coerce.number().optional().nullable(),
  gracePeriodDays: z.coerce.number().int().default(0),
  contractTermMonths: z.coerce.number().int().min(1).default(36),
  adjustmentIndex: z.nativeEnum(AdjustmentIndexType).default("IGPM"),
  guaranteeType: z.nativeEnum(GuaranteeType).default("CAUCAO"),
  guaranteeValue: z.coerce.number().optional().nullable(),
  validUntil: z.coerce.date(),
  specialConditions: z.string().optional().nullable(),
});

export type ProposalInput = z.infer<typeof proposalSchema>;

async function nextProposalNumber(propertyId: string) {
  const count = await prisma.proposal.count({ where: { propertyId } });
  const year = new Date().getFullYear();
  return `PR-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createProposal(input: ProposalInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "crm:manage");
  const data = proposalSchema.parse(input);

  const property = await prisma.property.findUniqueOrThrow({ where: { id: data.propertyId } });
  assertCompanyAccess(session, property.companyId);
  assertPropertyAccess(session, property.id);

  const number = await nextProposalNumber(data.propertyId);

  const proposal = await prisma.proposal.create({
    data: {
      number,
      propertyId: data.propertyId,
      tenantId: data.tenantId,
      leadId: data.leadId,
      totalArea: data.totalArea,
      rentValue: data.rentValue,
      condoFee: data.condoFee,
      iptuFee: data.iptuFee,
      promoFundFee: data.promoFundFee,
      gracePeriodDays: data.gracePeriodDays,
      contractTermMonths: data.contractTermMonths,
      adjustmentIndex: data.adjustmentIndex,
      guaranteeType: data.guaranteeType,
      guaranteeValue: data.guaranteeValue,
      validUntil: data.validUntil,
      specialConditions: data.specialConditions,
      status: "RASCUNHO",
      createdByUserId: session.user.id,
      units: { create: data.unitIds.map((unitId) => ({ unitId })) },
      versions: {
        create: { versionNumber: 1, snapshot: data, createdByUserId: session.user.id },
      },
    },
  });

  await recordAudit({
    companyId: property.companyId,
    userId: session.user.id,
    action: "CRIACAO",
    entity: "Proposal",
    entityId: proposal.id,
    newData: data,
  });

  revalidatePath("/propostas");
  return proposal;
}

export async function updateProposalStatus(id: string, status: ProposalStatus) {
  const session = await requireSession();
  requirePermission(session.user.role, "crm:manage");

  const existing = await prisma.proposal.findUniqueOrThrow({ where: { id }, include: { property: true } });
  assertCompanyAccess(session, existing.property.companyId);
  assertPropertyAccess(session, existing.propertyId);

  const proposal = await prisma.proposal.update({ where: { id }, data: { status } });

  await recordAudit({
    companyId: existing.property.companyId,
    userId: session.user.id,
    action: status === "APROVADA" ? "APROVACAO" : "ALTERACAO_STATUS",
    entity: "Proposal",
    entityId: id,
    previousData: { status: existing.status },
    newData: { status },
  });

  revalidatePath("/propostas");
  revalidatePath(`/propostas/${id}`);
  return proposal;
}
