import { requireTenantContext } from "@/lib/tenant-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FolderKanban, Download } from "lucide-react";
import { documentTypeLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default async function PortalDocumentsPage() {
  const { tenant } = await requireTenantContext();

  const documents = await prisma.document.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Meus documentos" description="Contratos, comprovantes e demais arquivos disponibilizados pela administradora." />
      {documents.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Nenhum documento disponível" />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.title}</TableCell>
                  <TableCell>{documentTypeLabels[doc.type]}</TableCell>
                  <TableCell>{formatDate(doc.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" aria-label="Baixar">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
