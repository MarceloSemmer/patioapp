"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, assertCompanyAccess } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { PersonType } from "@prisma/client";
import { onlyDigits } from "@/lib/masks";

const ownerSchema = z.object({
  companyId: z.string().uuid(),
  personType: z.nativeEnum(PersonType),
  name: z.string().min(2),
  document: z.string().min(1),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  unitIds: z.array(z.string().uuid()).default([]),
});

export type OwnerInput = z.infer<typeof ownerSchema>;

export async function createOwner(input: OwnerInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "owner:manage");
  const data = ownerSchema.parse(input);
  assertCompanyAccess(session, data.companyId);

  if (data.unitIds.length > 0) {
    const units = await prisma.unit.findMany({ where: { id: { in: data.unitIds } }, include: { property: true } });
    const foreign = units.find((u) => u.property.companyId !== data.companyId);
    if (foreign) {
      throw new Error("Uma ou mais unidades selecionadas não pertencem à empresa informada.");
    }
  }

  const owner = await prisma.owner.create({
    data: {
      companyId: data.companyId,
      personType: data.personType,
      name: data.name,
      document: onlyDigits(data.document),
      email: data.email || null,
      phone: data.phone || null,
      units: { create: data.unitIds.map((unitId) => ({ unitId })) },
    },
  });

  await recordAudit({ companyId: data.companyId, userId: session.user.id, action: "CRIACAO", entity: "Owner", entityId: owner.id, newData: data });

  revalidatePath("/proprietarios");
  return owner;
}
