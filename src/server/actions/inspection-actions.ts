"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, assertCompanyAccess, assertPropertyAccess } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { InspectionItemAnswer, InspectionType } from "@prisma/client";
import type { Session } from "next-auth";

async function resolveScope(contractId: string | null, unitId: string | null) {
  if (contractId) {
    const contract = await prisma.contract.findUniqueOrThrow({
      where: { id: contractId },
      include: { property: true },
    });
    return { companyId: contract.property.companyId, propertyId: contract.propertyId };
  }
  if (unitId) {
    const unit = await prisma.unit.findUniqueOrThrow({ where: { id: unitId }, include: { property: true } });
    return { companyId: unit.property.companyId, propertyId: unit.propertyId };
  }
  throw new Error("Informe um contrato ou uma unidade para a vistoria.");
}

const createInspectionSchema = z.object({
  contractId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  type: z.nativeEnum(InspectionType),
  scheduledAt: z.coerce.date().optional().nullable(),
  responsibleName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  itemLabels: z.array(z.string().min(1)).min(1, "Inclua ao menos um item no checklist."),
});

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;

export async function createInspection(input: CreateInspectionInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "inspection:manage");
  const data = createInspectionSchema.parse(input);

  const scope = await resolveScope(data.contractId ?? null, data.unitId ?? null);
  assertCompanyAccess(session, scope.companyId);
  assertPropertyAccess(session, scope.propertyId);

  const inspection = await prisma.inspection.create({
    data: {
      contractId: data.contractId || null,
      unitId: data.unitId || null,
      type: data.type,
      scheduledAt: data.scheduledAt || null,
      responsibleName: data.responsibleName || null,
      notes: data.notes || null,
      items: {
        create: data.itemLabels.map((label, index) => ({ label, order: index })),
      },
    },
  });

  await recordAudit({
    companyId: scope.companyId,
    userId: session.user.id,
    action: "CRIACAO",
    entity: "Inspection",
    entityId: inspection.id,
    newData: data,
  });

  revalidatePath("/vistorias");
  return inspection;
}

async function assertInspectionAccess(inspectionId: string, session: Session) {
  const inspection = await prisma.inspection.findUniqueOrThrow({
    where: { id: inspectionId },
    include: {
      contract: { include: { property: true } },
      unit: { include: { property: true } },
    },
  });
  const property = inspection.contract?.property ?? inspection.unit?.property;
  if (!property) {
    throw new Error("Não foi possível determinar a empresa desta vistoria.");
  }
  assertCompanyAccess(session, property.companyId);
  assertPropertyAccess(session, property.id);
  return { inspection, companyId: property.companyId };
}

const updateItemSchema = z.object({
  itemId: z.string().uuid(),
  answer: z.nativeEnum(InspectionItemAnswer).optional().nullable(),
  notes: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export async function updateInspectionItem(input: z.infer<typeof updateItemSchema>) {
  const session = await requireSession();
  requirePermission(session.user.role, "inspection:manage");
  const data = updateItemSchema.parse(input);

  const item = await prisma.inspectionItem.findUniqueOrThrow({ where: { id: data.itemId } });
  await assertInspectionAccess(item.inspectionId, session);

  const updated = await prisma.inspectionItem.update({
    where: { id: data.itemId },
    data: {
      answer: data.answer ?? undefined,
      notes: data.notes ?? undefined,
      photoUrl: data.photoUrl ?? undefined,
    },
  });

  revalidatePath(`/vistorias/${item.inspectionId}`);
  return updated;
}

const completeInspectionSchema = z.object({
  inspectionId: z.string().uuid(),
  performedAt: z.coerce.date().optional(),
  responsibleName: z.string().optional().nullable(),
  signedByTenant: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export async function completeInspection(input: z.infer<typeof completeInspectionSchema>) {
  const session = await requireSession();
  requirePermission(session.user.role, "inspection:manage");
  const data = completeInspectionSchema.parse(input);

  const { companyId } = await assertInspectionAccess(data.inspectionId, session);

  const inspection = await prisma.inspection.update({
    where: { id: data.inspectionId },
    data: {
      performedAt: data.performedAt ?? new Date(),
      responsibleName: data.responsibleName || undefined,
      signedByTenant: data.signedByTenant,
      notes: data.notes ?? undefined,
    },
  });

  await recordAudit({
    companyId,
    userId: session.user.id,
    action: "ALTERACAO_STATUS",
    entity: "Inspection",
    entityId: inspection.id,
    newData: { performedAt: inspection.performedAt, signedByTenant: inspection.signedByTenant },
  });

  revalidatePath("/vistorias");
  revalidatePath(`/vistorias/${inspection.id}`);
  return inspection;
}
