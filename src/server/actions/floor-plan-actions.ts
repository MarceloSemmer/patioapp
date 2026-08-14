"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const createFloorPlanSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1),
  imageUrl: z.string().min(1),
});

export async function createFloorPlan(input: z.infer<typeof createFloorPlanSchema>) {
  const session = await requireSession();
  requirePermission(session.user.role, "property:manage");
  const data = createFloorPlanSchema.parse(input);

  const property = await prisma.property.findUniqueOrThrow({ where: { id: data.propertyId } });
  const floorPlan = await prisma.floorPlan.create({ data });

  await recordAudit({
    companyId: property.companyId,
    userId: session.user.id,
    action: "CRIACAO",
    entity: "FloorPlan",
    entityId: floorPlan.id,
    newData: data,
  });

  revalidatePath(`/empreendimentos/${data.propertyId}/planta`);
  return floorPlan;
}

const areaSchema = z.object({
  floorPlanId: z.string().uuid(),
  unitId: z.string().uuid(),
  x: z.coerce.number().min(0).max(100),
  y: z.coerce.number().min(0).max(100),
  width: z.coerce.number().min(0.5).max(100),
  height: z.coerce.number().min(0.5).max(100),
});

export async function upsertFloorPlanArea(input: z.infer<typeof areaSchema>) {
  const session = await requireSession();
  requirePermission(session.user.role, "property:manage");
  const data = areaSchema.parse(input);

  const area = await prisma.floorPlanArea.upsert({
    where: { floorPlanId_unitId: { floorPlanId: data.floorPlanId, unitId: data.unitId } },
    update: { x: data.x, y: data.y, width: data.width, height: data.height },
    create: data,
    include: { floorPlan: { select: { propertyId: true } } },
  });

  revalidatePath(`/empreendimentos/${area.floorPlan.propertyId}/planta`);
  return area;
}

export async function deleteFloorPlanArea(id: string) {
  const session = await requireSession();
  requirePermission(session.user.role, "property:manage");

  const area = await prisma.floorPlanArea.delete({
    where: { id },
    include: { floorPlan: { select: { propertyId: true } } },
  });

  revalidatePath(`/empreendimentos/${area.floorPlan.propertyId}/planta`);
}
