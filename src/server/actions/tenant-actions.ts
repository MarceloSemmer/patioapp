"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { PersonType, TenantStatus } from "@prisma/client";
import { isValidCpfCnpj, onlyDigits } from "@/lib/masks";

const tenantSchema = z.object({
  companyId: z.string().uuid(),
  personType: z.nativeEnum(PersonType),
  name: z.string().min(2, "Informe o nome ou razão social."),
  tradeName: z.string().optional().nullable(),
  document: z.string().refine((v) => isValidCpfCnpj(v), "CPF/CNPJ inválido."),
  stateRegistration: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  legalResponsible: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")).nullable(),
  website: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  billingNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.nativeEnum(TenantStatus),
});

export type TenantInput = z.infer<typeof tenantSchema>;

export async function createTenant(input: TenantInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "tenant:manage");
  const data = tenantSchema.parse(input);

  if (session.user.role !== "SUPERADMIN" && !session.user.companyIds.includes(data.companyId)) {
    throw new Error("Você não tem acesso a esta empresa.");
  }

  const existing = await prisma.tenant.findFirst({
    where: { companyId: data.companyId, document: onlyDigits(data.document) },
  });
  if (existing) {
    throw new Error("Já existe um locatário cadastrado com este CPF/CNPJ.");
  }

  const tenant = await prisma.tenant.create({
    data: { ...data, document: onlyDigits(data.document), email: data.email || null },
  });

  await recordAudit({
    companyId: data.companyId,
    userId: session.user.id,
    action: "CRIACAO",
    entity: "Tenant",
    entityId: tenant.id,
    newData: data,
  });

  revalidatePath("/locatarios");
  return tenant;
}

export async function updateTenant(id: string, input: TenantInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "tenant:manage");
  const data = tenantSchema.parse(input);

  const existing = await prisma.tenant.findUniqueOrThrow({ where: { id } });
  const tenant = await prisma.tenant.update({
    where: { id },
    data: { ...data, document: onlyDigits(data.document), email: data.email || null },
  });

  await recordAudit({
    companyId: existing.companyId,
    userId: session.user.id,
    action: "ALTERACAO",
    entity: "Tenant",
    entityId: id,
    previousData: existing,
    newData: tenant,
  });

  revalidatePath("/locatarios");
  revalidatePath(`/locatarios/${id}`);
  return tenant;
}

const contactSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  role: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
});

export async function addTenantContact(input: z.infer<typeof contactSchema>) {
  const session = await requireSession();
  requirePermission(session.user.role, "tenant:manage");
  const data = contactSchema.parse(input);

  const contact = await prisma.tenantContact.create({ data });
  revalidatePath(`/locatarios/${data.tenantId}`);
  return contact;
}

const selfUpdateSchema = z.object({
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")).nullable(),
});

/**
 * Atualização de contato pelo próprio locatário autenticado no portal.
 * Nesta versão a alteração é aplicada imediatamente (sem fila de aprovação);
 * a auditoria registra a alteração para rastreabilidade. Um fluxo de
 * aprovação por um gestor pode ser adicionado futuramente reutilizando o
 * mesmo registro de auditoria como base.
 */
export async function updateOwnTenantContact(input: z.infer<typeof selfUpdateSchema>) {
  const session = await requireSession();
  if (session.user.role !== "LOCATARIO" || !session.user.tenantId) {
    throw new Error("Acesso negado.");
  }
  const data = selfUpdateSchema.parse(input);

  const existing = await prisma.tenant.findUniqueOrThrow({ where: { id: session.user.tenantId } });
  const tenant = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { phone: data.phone || null, whatsapp: data.whatsapp || null, email: data.email || null },
  });

  await recordAudit({
    companyId: existing.companyId,
    userId: session.user.id,
    action: "ALTERACAO",
    entity: "Tenant",
    entityId: tenant.id,
    previousData: { phone: existing.phone, whatsapp: existing.whatsapp, email: existing.email },
    newData: data,
  });

  revalidatePath("/portal/perfil");
  return tenant;
}

export async function removeTenantContact(id: string) {
  const session = await requireSession();
  requirePermission(session.user.role, "tenant:manage");
  const contact = await prisma.tenantContact.delete({ where: { id } });
  revalidatePath(`/locatarios/${contact.tenantId}`);
}
