"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, assertCompanyAccess, assertPropertyAccess } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { AdjustmentIndexType, ContractStatus, ContractType, GuaranteeType } from "@prisma/client";
import { addMonths } from "date-fns";

/**
 * Situações de contrato que "ocupam" a unidade e, portanto, impedem outro
 * contrato conflitante no mesmo período (regra de negócio nº 1).
 */
export const OCCUPYING_CONTRACT_STATUSES: ContractStatus[] = [
  "EM_ASSINATURA",
  "ATIVO",
  "EM_CARENCIA",
  "PROXIMO_VENCIMENTO",
  "RENOVACAO",
];

async function assertNoConflict(unitIds: string[], startDate: Date, endDate: Date, excludeContractId?: string) {
  const conflicting = await prisma.contractUnit.findMany({
    where: {
      unitId: { in: unitIds },
      contract: {
        id: excludeContractId ? { not: excludeContractId } : undefined,
        status: { in: OCCUPYING_CONTRACT_STATUSES },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    },
    include: { contract: { select: { number: true } }, unit: { select: { code: true } } },
  });

  if (conflicting.length > 0) {
    const details = conflicting.map((c) => `${c.unit.code} (contrato ${c.contract.number})`).join(", ");
    throw new Error(
      `Não é possível salvar: a(s) unidade(s) já possuem contrato ativo no período informado — ${details}.`,
    );
  }
}

const contractSchema = z.object({
  propertyId: z.string().uuid(),
  tenantId: z.string().uuid(),
  proposalId: z.string().uuid().optional().nullable(),
  unitIds: z.array(z.string().uuid()).min(1, "Selecione ao menos uma unidade."),
  type: z.nativeEnum(ContractType).default("LOCACAO_PADRAO"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  initialValue: z.coerce.number().positive(),
  dueDay: z.coerce.number().int().min(1).max(28).default(10),
  gracePeriodDays: z.coerce.number().int().default(0),
  adjustmentIndex: z.nativeEnum(AdjustmentIndexType).default("IGPM"),
  adjustmentPeriodMonths: z.coerce.number().int().default(12),
  condoFee: z.coerce.number().optional().nullable(),
  iptuFee: z.coerce.number().optional().nullable(),
  promoFundFee: z.coerce.number().optional().nullable(),
  otherFees: z.coerce.number().optional().nullable(),
  guaranteeType: z.nativeEnum(GuaranteeType).default("CAUCAO"),
  guaranteeValue: z.coerce.number().optional().nullable(),
  guarantorName: z.string().optional().nullable(),
  noticePeriodDays: z.coerce.number().int().default(30),
  commercialResponsible: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine((d) => d.endDate > d.startDate, { message: "A data final deve ser posterior à inicial.", path: ["endDate"] });

export type ContractInput = z.infer<typeof contractSchema>;

async function nextContractNumber(propertyId: string) {
  const count = await prisma.contract.count({ where: { propertyId } });
  const year = new Date().getFullYear();
  return `CT-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createContract(input: ContractInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "contract:manage");
  const data = contractSchema.parse(input);

  const property = await prisma.property.findUniqueOrThrow({ where: { id: data.propertyId } });
  assertCompanyAccess(session, property.companyId);
  assertPropertyAccess(session, property.id);

  await assertNoConflict(data.unitIds, data.startDate, data.endDate);

  const number = await nextContractNumber(data.propertyId);
  const nextAdjustmentDate = addMonths(data.startDate, data.adjustmentPeriodMonths);
  const firstDueDate = addMonths(data.startDate, 0);

  const contract = await prisma.$transaction(async (tx) => {
    const created = await tx.contract.create({
      data: {
        number,
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        proposalId: data.proposalId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        initialValue: data.initialValue,
        dueDay: data.dueDay,
        gracePeriodDays: data.gracePeriodDays,
        firstDueDate,
        adjustmentIndex: data.adjustmentIndex,
        adjustmentPeriodMonths: data.adjustmentPeriodMonths,
        nextAdjustmentDate,
        condoFee: data.condoFee,
        iptuFee: data.iptuFee,
        promoFundFee: data.promoFundFee,
        otherFees: data.otherFees,
        guaranteeType: data.guaranteeType,
        guaranteeValue: data.guaranteeValue,
        guarantorName: data.guarantorName,
        noticePeriodDays: data.noticePeriodDays,
        commercialResponsible: data.commercialResponsible,
        notes: data.notes,
        status: "MINUTA",
        createdByUserId: session.user.id,
        units: { create: data.unitIds.map((unitId) => ({ unitId })) },
      },
    });

    if (data.proposalId) {
      await tx.proposal.update({ where: { id: data.proposalId }, data: { status: "CONVERTIDA" } });
    }

    return created;
  });

  await recordAudit({
    companyId: property.companyId,
    userId: session.user.id,
    action: "CRIACAO",
    entity: "Contract",
    entityId: contract.id,
    newData: data,
  });

  revalidatePath("/contratos");
  return contract;
}

export async function changeContractStatus(contractId: string, status: ContractStatus, reason?: string) {
  const session = await requireSession();
  requirePermission(session.user.role, "contract:manage");

  const existing = await prisma.contract.findUniqueOrThrow({
    where: { id: contractId },
    include: { property: true, units: { include: { unit: true } } },
  });
  assertCompanyAccess(session, existing.property.companyId);
  assertPropertyAccess(session, existing.propertyId);

  if (OCCUPYING_CONTRACT_STATUSES.includes(status)) {
    await assertNoConflict(
      existing.units.map((u) => u.unitId),
      existing.startDate,
      existing.endDate,
      contractId,
    );
  }

  const unitTargetStatus =
    status === "ATIVO" || status === "PROXIMO_VENCIMENTO" || status === "RENOVACAO"
      ? "OCUPADA"
      : status === "EM_CARENCIA"
        ? "EM_CARENCIA"
        : status === "ENCERRADO" || status === "RESCINDIDO"
          ? "DISPONIVEL"
          : null;

  const contract = await prisma.$transaction(async (tx) => {
    const updated = await tx.contract.update({ where: { id: contractId }, data: { status } });

    if (unitTargetStatus) {
      for (const cu of existing.units) {
        if (cu.unit.status === unitTargetStatus) continue;
        await tx.unit.update({ where: { id: cu.unitId }, data: { status: unitTargetStatus } });
        await tx.unitStatusHistory.create({
          data: {
            unitId: cu.unitId,
            previousStatus: cu.unit.status,
            newStatus: unitTargetStatus,
            reason: reason ?? `Alteração automática decorrente do status do contrato ${existing.number} (${status}).`,
            changedByUserId: session.user.id,
          },
        });
      }
    }

    return updated;
  });

  await recordAudit({
    companyId: existing.property.companyId,
    userId: session.user.id,
    action: "ALTERACAO_STATUS",
    entity: "Contract",
    entityId: contractId,
    previousData: { status: existing.status },
    newData: { status, reason },
  });

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${contractId}`);
  revalidatePath("/unidades");
  return contract;
}

const addendumSchema = z.object({
  contractId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  effectiveDate: z.coerce.date(),
});

export async function addContractAddendum(input: z.infer<typeof addendumSchema>) {
  const session = await requireSession();
  requirePermission(session.user.role, "contract:manage");
  const data = addendumSchema.parse(input);

  const contract = await prisma.contract.findUniqueOrThrow({ where: { id: data.contractId }, include: { property: true } });
  assertCompanyAccess(session, contract.property.companyId);
  assertPropertyAccess(session, contract.propertyId);

  const addendum = await prisma.contractAddendum.create({ data });
  revalidatePath(`/contratos/${data.contractId}`);
  return addendum;
}
