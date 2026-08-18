"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, assertCompanyAccess } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { DocumentType } from "@prisma/client";

const documentSchema = z.object({
  companyId: z.string().uuid(),
  propertyId: z.string().uuid().optional().nullable(),
  unitId: z.string().uuid().optional().nullable(),
  tenantId: z.string().uuid().optional().nullable(),
  contractId: z.string().uuid().optional().nullable(),
  type: z.nativeEnum(DocumentType),
  title: z.string().min(1, "Informe um título."),
  tags: z.array(z.string()).default([]),
  fileUrl: z.string().min(1, "Envie um arquivo."),
  isPrivate: z.boolean().default(true),
  expiresAt: z.coerce.date().optional().nullable(),
});

export type DocumentInput = z.infer<typeof documentSchema>;

export async function uploadDocument(input: DocumentInput) {
  const session = await requireSession();
  requirePermission(session.user.role, "document:manage");
  const data = documentSchema.parse(input);
  assertCompanyAccess(session, data.companyId);

  if (data.propertyId) {
    const property = await prisma.property.findUniqueOrThrow({ where: { id: data.propertyId } });
    if (property.companyId !== data.companyId) {
      throw new Error("O empreendimento informado não pertence à empresa selecionada.");
    }
  }
  if (data.tenantId) {
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: data.tenantId } });
    if (tenant.companyId !== data.companyId) {
      throw new Error("O locatário informado não pertence à empresa selecionada.");
    }
  }

  const document = await prisma.document.create({
    data: { ...data, uploadedByUserId: session.user.id },
  });

  await recordAudit({
    companyId: data.companyId,
    userId: session.user.id,
    action: "CRIACAO",
    entity: "Document",
    entityId: document.id,
    newData: { title: data.title, type: data.type },
  });

  revalidatePath("/documentos");
  return document;
}

export async function logDocumentDownload(documentId: string) {
  const session = await requireSession();
  const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  if (session.user.role !== "LOCATARIO") {
    assertCompanyAccess(session, document.companyId);
  } else if (document.tenantId !== session.user.tenantId) {
    throw new Error("Acesso negado.");
  }

  await recordAudit({
    companyId: document.companyId,
    userId: session.user.id,
    action: "DOWNLOAD_DOCUMENTO",
    entity: "Document",
    entityId: documentId,
  });
}
