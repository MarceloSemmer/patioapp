import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession, assertCompanyAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { inspectionTypeLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";
import { resolveFileUrl } from "@/lib/storage";
import { InspectionChecklist } from "./inspection-checklist";
import { CompleteInspectionDialog } from "./complete-inspection-dialog";

export const metadata = { title: "Vistoria" };

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      contract: {
        select: {
          number: true,
          property: { select: { id: true, name: true, companyId: true } },
          tenant: { select: { name: true, document: true } },
          units: { select: { unit: { select: { code: true } } } },
        },
      },
      unit: { select: { code: true, property: { select: { id: true, name: true, companyId: true } } } },
      items: { orderBy: { order: "asc" } },
    },
  });

  if (!inspection) {
    notFound();
  }

  const property = inspection.contract?.property ?? inspection.unit?.property;
  if (!property) {
    notFound();
  }
  assertCompanyAccess(session, property.companyId);

  const canManage = roleHasPermission(session.user.role, "inspection:manage");

  const itemsWithUrls = await Promise.all(
    inspection.items.map(async (item) => ({
      id: item.id,
      label: item.label,
      answer: item.answer,
      notes: item.notes,
      photoUrl: item.photoUrl,
      photoDisplayUrl: item.photoUrl ? await resolveFileUrl(item.photoUrl) : null,
    })),
  );

  const linkedTo = inspection.contract
    ? `Contrato ${inspection.contract.number} — ${inspection.contract.tenant.name} (${inspection.contract.units.map((u) => u.unit.code).join(", ") || "sem unidade"})`
    : inspection.unit
      ? `Unidade ${inspection.unit.code}`
      : "—";

  return (
    <div>
      <Link href="/vistorias" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para vistorias
      </Link>
      <PageHeader
        title={`Vistoria de ${inspectionTypeLabels[inspection.type]}`}
        description={`${property.name} — ${linkedTo}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={`/api/vistorias/${inspection.id}/pdf`} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" /> Baixar laudo em PDF
              </a>
            </Button>
            {canManage && !inspection.performedAt && (
              <CompleteInspectionDialog
                inspectionId={inspection.id}
                defaultResponsibleName={inspection.responsibleName ?? ""}
                defaultNotes={inspection.notes ?? ""}
              />
            )}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge variant={inspection.performedAt ? "default" : "outline"}>{inspection.performedAt ? "Realizada" : "Agendada"}</Badge>
        {inspection.performedAt && <span className="text-sm text-muted-foreground">em {formatDate(inspection.performedAt)}</span>}
        {!inspection.performedAt && inspection.scheduledAt && (
          <span className="text-sm text-muted-foreground">agendada para {formatDate(inspection.scheduledAt)}</span>
        )}
        {inspection.responsibleName && <span className="text-sm text-muted-foreground">Responsável: {inspection.responsibleName}</span>}
        {inspection.performedAt && (
          <Badge variant={inspection.signedByTenant ? "default" : "warning"}>
            {inspection.signedByTenant ? "Assinada pelo locatário" : "Sem assinatura do locatário"}
          </Badge>
        )}
      </div>

      {inspection.notes && (
        <div className="mb-4 rounded-lg border bg-muted/30 p-3 text-sm">
          <span className="font-medium">Observações gerais: </span>
          {inspection.notes}
        </div>
      )}

      <InspectionChecklist items={itemsWithUrls} canManage={canManage} />
    </div>
  );
}
