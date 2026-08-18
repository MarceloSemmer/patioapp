"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, assertCompanyAccess, assertPropertyAccess } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { UnitType, UnitStatus } from "@prisma/client";

const unitSchema = z.object({
  propertyId: z.string().uuid(),
  sectorId: z.string().uuid().optional().nullable(),
  code: z.string().min(1, "Informe o código da unidade."),
  commercialName: z.string().optional().nullable(),
  type: z.nativeEnum(UnitType),
  privateArea: z.coerce.number().positive("Informe a área privativa."),
  commonArea: z.coerce.number().optional().nullable(),
  totalArea: z.coerce.number().positive("Informe a área total."),
  frontageWidth: z.coerce.number().optional().nullable(),
  ceilingHeight: z.coerce.number().optional().nullable(),
  capacity: z.coerce.number().int().optional().nullable(),
  parkingSpaces: z.coerce.number().int().optional().nullable(),
  suggestedRentPerSqm: z.coerce.number().optional().nullable(),
  suggestedRent: z.coerce.number().optional().nullable(),
  condoFee: z.coerce.number().optional().nullable(),
  iptuFee: z.coerce.number().optional().nullable(),
  promoFundFee: z.coerce.number().optional().nullable(),
  extraFees: z.coerce.number().optional().nullable(),
  keyMoney: z.coerce.number().optional().nullable(),
  suggestedDeposit: z.coerce.number().optional().nullable(),
  allowedSegments: z.array(z.string()).default([]),
  disallowedSegments: z.array(z.string()).default([]),
  hasElectrical: z.boolean().default(true),
  hasWater: z.boolean().default(true),
  hasGas: z.boolean().default(false),
  hasExhaustion: z.boolean().default(false),
  hasInternet: z.boolean().default(true),
  hasAccessibility: z.boolean().default(false),
  hasBathroom: z.boolean().default(false),
  technicalNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type UnitInput = z.infer<typeof unitSchema>;

export async function createUnit(input: UnitInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "unit:manage");
  const data = unitSchema.parse(input);

  const property = await prisma.property.findUniqueOrThrow({ where: { id: data.propertyId } });
  assertCompanyAccess(session, property.companyId);
  assertPropertyAccess(session, property.id);

  const unit = await prisma.unit.create({ data });

  await prisma.unitStatusHistory.create({
    data: { unitId: unit.id, newStatus: "DISPONIVEL", reason: "Cadastro inicial da unidade.", changedByUserId: session.user.id },
  });

  await recordAudit({
    companyId: property.companyId,
    userId: session.user.id,
    action: "CRIACAO",
    entity: "Unit",
    entityId: unit.id,
    newData: data,
  });

  revalidatePath("/unidades");
  revalidatePath(`/empreendimentos/${data.propertyId}`);
  return unit;
}

export async function updateUnit(id: string, input: UnitInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "unit:manage");
  const data = unitSchema.parse(input);

  const existing = await prisma.unit.findUniqueOrThrow({ where: { id }, include: { property: true } });
  assertCompanyAccess(session, existing.property.companyId);
  assertPropertyAccess(session, existing.propertyId);

  if (data.propertyId !== existing.propertyId) {
    const targetProperty = await prisma.property.findUniqueOrThrow({ where: { id: data.propertyId } });
    assertCompanyAccess(session, targetProperty.companyId);
    assertPropertyAccess(session, targetProperty.id);
  }

  const unit = await prisma.unit.update({ where: { id }, data });

  await recordAudit({
    companyId: existing.property.companyId,
    userId: session.user.id,
    action: "ALTERACAO",
    entity: "Unit",
    entityId: id,
    previousData: existing,
    newData: unit,
  });

  revalidatePath("/unidades");
  revalidatePath(`/unidades/${id}`);
  return unit;
}

const statusChangeSchema = z.object({
  unitId: z.string().uuid(),
  newStatus: z.nativeEnum(UnitStatus),
  reason: z.string().min(3, "Informe o motivo da alteração."),
});

export async function changeUnitStatus(input: z.infer<typeof statusChangeSchema>) {
  const session = await requireSession();
  requirePermission(session.user.role, "unit:manage");
  const data = statusChangeSchema.parse(input);

  const existing = await prisma.unit.findUniqueOrThrow({ where: { id: data.unitId }, include: { property: true } });
  assertCompanyAccess(session, existing.property.companyId);
  assertPropertyAccess(session, existing.propertyId);

  const unit = await prisma.$transaction(async (tx) => {
    const updated = await tx.unit.update({ where: { id: data.unitId }, data: { status: data.newStatus } });
    await tx.unitStatusHistory.create({
      data: {
        unitId: data.unitId,
        previousStatus: existing.status,
        newStatus: data.newStatus,
        reason: data.reason,
        changedByUserId: session.user.id,
      },
    });
    return updated;
  });

  await recordAudit({
    companyId: existing.property.companyId,
    userId: session.user.id,
    action: "ALTERACAO_STATUS",
    entity: "Unit",
    entityId: data.unitId,
    previousData: { status: existing.status },
    newData: { status: data.newStatus, reason: data.reason },
  });

  revalidatePath("/unidades");
  revalidatePath(`/unidades/${data.unitId}`);
  return unit;
}
