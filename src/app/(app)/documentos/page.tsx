import { requireSession, companyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FolderKanban } from "lucide-react";
import { documentTypeLabels } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";
import { DocumentUploadDialog } from "./document-upload-dialog";
import { DocumentDownloadLink } from "./document-download-link";

export const metadata = { title: "Documentos" };

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ empreendimento?: string; tipo?: string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const companyIds = companyScope(session);

  const companies = await prisma.company.findMany({
    where: session.user.role === "SUPERADMIN" ? {} : { id: { in: session.user.companyIds } },
    select: { id: true, name: true },
  });

  const properties = await prisma.property.findMany({
    where: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
    select: { id: true, name: true, companyId: true },
    orderBy: { name: "asc" },
  });

  const documents = await prisma.document.findMany({
    where: {
      ...(companyIds ? { companyId: { in: companyIds } } : {}),
      ...(params.empreendimento ? { propertyId: params.empreendimento } : {}),
      ...(params.tipo ? { type: params.tipo as never } : {}),
    },
    include: {
      property: { select: { name: true } },
      tenant: { select: { name: true } },
      contract: { select: { number: true } },
      uploadedByUser: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const canManage = roleHasPermission(session.user.role, "document:manage");
  const now = new Date();

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Central de documentos por empreendimento, unidade, locatário e contrato."
        actions={canManage && companies.length > 0 ? <DocumentUploadDialog companies={companies} properties={properties} /> : undefined}
      />

      {documents.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Nenhum documento enviado" description="Envie contratos, laudos, plantas e demais documentos." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vinculado a</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => {
                const expiringSoon = doc.expiresAt && doc.expiresAt.getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 30;
                const expired = doc.expiresAt && doc.expiresAt < now;
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>{documentTypeLabels[doc.type]}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[doc.property?.name, doc.tenant?.name, doc.contract?.number].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(doc.createdAt)}
                      {doc.uploadedByUser && <div>por {doc.uploadedByUser.name}</div>}
                    </TableCell>
                    <TableCell>
                      {doc.expiresAt ? (
                        <Badge variant={expired ? "destructive" : expiringSoon ? "warning" : "outline"}>{formatDate(doc.expiresAt)}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DocumentDownloadLink documentId={doc.id} fileUrl={doc.fileUrl} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
