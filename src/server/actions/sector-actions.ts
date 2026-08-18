"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, assertCompanyAccess, assertPropertyAccess } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { SectorType } from "@prisma/client";

const sectorSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1, "Informe o nome do setor."),
  type: z.nativeEnum(SectorType),
  order: z.coerce.number().int().default(0),
  area: z.coerce.number().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type SectorInput = z.infer<typeof sectorSchema>;

export async function createSector(input: SectorInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "property:manage");
  const data = sectorSchema.parse(input);

  const property = await prisma.property.findUniqueOrThrow({ where: { id: data.propertyId } });
  assertCompanyAccess(session, property.companyId);
  assertPropertyAccess(session, property.id);

  const sector = await prisma.sector.create({ data });

  await recordAudit({
    companyId: property.companyId,
    userId: session.user.id,
    action: "CRIACAO",
    entity: "Sector",
    entityId: sector.id,
    newData: data,
  });

  revalidatePath(`/empreendimentos/${data.propertyId}`);
  return sector;
}

export async function updateSector(id: string, input: SectorInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "property:manage");
  const data = sectorSchema.parse(input);

  const existing = await prisma.sector.findUniqueOrThrow({ where: { id }, include: { property: true } });
  assertCompanyAccess(session, existing.property.companyId);
  assertPropertyAccess(session, existing.propertyId);

  const sector = await prisma.sector.update({ where: { id }, data });

  await recordAudit({
    companyId: existing.property.companyId,
    userId: session.user.id,
    action: "ALTERACAO",
    entity: "Sector",
    entityId: id,
    previousData: existing,
    newData: sector,
  });

  revalidatePath(`/empreendimentos/${data.propertyId}`);
  return sector;
}

export async function deleteSector(id: string) {
  const session = await requireSession();
  requirePermission(session.user.role, "property:manage");

  const existing = await prisma.sector.findUniqueOrThrow({ where: { id }, include: { property: true } });
  assertCompanyAccess(session, existing.property.companyId);
  assertPropertyAccess(session, existing.propertyId);

  const unitsCount = await prisma.unit.count({ where: { sectorId: id, deletedAt: null } });
  if (unitsCount > 0) {
    throw new Error("Não é possível excluir um setor que possui unidades cadastradas.");
  }

  await prisma.sector.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });

  await recordAudit({
    companyId: existing.property.companyId,
    userId: session.user.id,
    action: "EXCLUSAO_LOGICA",
    entity: "Sector",
    entityId: id,
  });

  revalidatePath(`/empreendimentos/${existing.propertyId}`);
}
