"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
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

  await recordAudit({
    companyId: document.companyId,
    userId: session.user.id,
    action: "DOWNLOAD_DOCUMENTO",
    entity: "Document",
    entityId: documentId,
  });
}
