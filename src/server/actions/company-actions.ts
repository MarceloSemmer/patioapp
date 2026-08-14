"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const companySchema = z.object({
  name: z.string().min(2, "Informe o nome da empresa."),
  tradeName: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
});

export type CompanyInput = z.infer<typeof companySchema>;

export async function createCompany(input: CompanyInput) {
  const session = await requireSession();
  if (session.user.role !== "SUPERADMIN") {
    throw new Error("Apenas o superadministrador pode cadastrar empresas administradoras.");
  }
  const data = companySchema.parse(input);

  const company = await prisma.company.create({
    data: { ...data, email: data.email || null, settings: { create: {} } },
  });

  await recordAudit({ companyId: company.id, userId: session.user.id, action: "CRIACAO", entity: "Company", entityId: company.id, newData: data });

  revalidatePath("/empresas");
  return company;
}

const settingsSchema = z.object({
  companyId: z.string().uuid(),
  contractNumberPrefix: z.string().min(1),
  proposalNumberPrefix: z.string().min(1),
  ticketNumberPrefix: z.string().min(1),
  contractAlertDays: z.array(z.coerce.number().int()),
  ownersModuleEnabled: z.boolean(),
});

export async function updateCompanySettings(input: z.infer<typeof settingsSchema>) {
  const session = await requireSession();
  requirePermission(session.user.role, "settings:manage");
  const data = settingsSchema.parse(input);

  if (session.user.role !== "SUPERADMIN" && !session.user.companyIds.includes(data.companyId)) {
    throw new Error("Você não tem acesso a esta empresa.");
  }

  await prisma.companySettings.upsert({
    where: { companyId: data.companyId },
    update: {
      contractNumberPrefix: data.contractNumberPrefix,
      proposalNumberPrefix: data.proposalNumberPrefix,
      ticketNumberPrefix: data.ticketNumberPrefix,
      contractAlertDays: data.contractAlertDays,
    },
    create: {
      companyId: data.companyId,
      contractNumberPrefix: data.contractNumberPrefix,
      proposalNumberPrefix: data.proposalNumberPrefix,
      ticketNumberPrefix: data.ticketNumberPrefix,
      contractAlertDays: data.contractAlertDays,
    },
  });

  await prisma.company.update({ where: { id: data.companyId }, data: { ownersModuleEnabled: data.ownersModuleEnabled } });

  await recordAudit({ companyId: data.companyId, userId: session.user.id, action: "ALTERACAO", entity: "CompanySettings", entityId: data.companyId, newData: data });

  revalidatePath("/configuracoes");
}
