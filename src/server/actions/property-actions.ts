"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, assertCompanyAccess } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { PropertyStatus } from "@prisma/client";

const propertySchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(2, "Informe o nome do empreendimento."),
  internalCode: z.string().min(1, "Informe o código interno."),
  cnpj: z.string().optional().nullable(),
  municipalRegistry: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")).nullable(),
  whatsapp: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  totalArea: z.coerce.number().positive("Informe a área total."),
  builtArea: z.coerce.number().optional().nullable(),
  leasableArea: z.coerce.number().positive("Informe a área locável."),
  parkingSpaces: z.coerce.number().int().optional().nullable(),
  openingHours: z.string().optional().nullable(),
  responsibleName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amenities: z.array(z.string()).optional().default([]),
  internalRules: z.string().optional().nullable(),
  status: z.nativeEnum(PropertyStatus),
  notes: z.string().optional().nullable(),
});

export type PropertyInput = z.infer<typeof propertySchema>;

export async function createProperty(input: PropertyInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "property:manage");
  const data = propertySchema.parse(input);
  assertCompanyAccess(session, data.companyId);

  const property = await prisma.property.create({
    data: { ...data, email: data.email || null },
  });

  await recordAudit({
    companyId: data.companyId,
    userId: session.user.id,
    action: "CRIACAO",
    entity: "Property",
    entityId: property.id,
    newData: data,
  });

  revalidatePath("/empreendimentos");
  return property;
}

export async function updateProperty(id: string, input: PropertyInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "property:manage");
  const data = propertySchema.parse(input);

  const existing = await prisma.property.findUniqueOrThrow({ where: { id } });
  assertCompanyAccess(session, existing.companyId);
  assertCompanyAccess(session, data.companyId);

  const property = await prisma.property.update({
    where: { id },
    data: { ...data, email: data.email || null },
  });

  await recordAudit({
    companyId: existing.companyId,
    userId: session.user.id,
    action: "ALTERACAO",
    entity: "Property",
    entityId: id,
    previousData: existing,
    newData: property,
  });

  revalidatePath("/empreendimentos");
  revalidatePath(`/empreendimentos/${id}`);
  return property;
}

export async function changePropertyStatus(id: string, status: PropertyStatus) {
  const session = await requireSession();
  requirePermission(session.user.role, "property:manage");

  const existing = await prisma.property.findUniqueOrThrow({ where: { id } });
  assertCompanyAccess(session, existing.companyId);

  const property = await prisma.property.update({ where: { id }, data: { status } });

  await recordAudit({
    companyId: existing.companyId,
    userId: session.user.id,
    action: "ALTERACAO_STATUS",
    entity: "Property",
    entityId: id,
    previousData: { status: existing.status },
    newData: { status },
  });

  revalidatePath("/empreendimentos");
  revalidatePath(`/empreendimentos/${id}`);
  return property;
}
