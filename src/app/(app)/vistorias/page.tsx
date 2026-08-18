import Link from "next/link";
import { requireSession, companyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardCheck } from "lucide-react";
import { inspectionTypeLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";
import { InspectionFormDialog } from "./inspection-form-dialog";

export const metadata = { title: "Vistorias" };

export default async function InspectionsPage({ searchParams }: { searchParams: Promise<{ empreendimento?: string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const companyIds = companyScope(session);
  const companyFilter = companyIds ? { companyId: { in: companyIds } } : {};

  const properties = await prisma.property.findMany({
    where: { deletedAt: null, ...companyFilter },
    select: {
      id: true,
      name: true,
      units: { where: { deletedAt: null }, select: { id: true, code: true }, orderBy: { code: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  const contracts = await prisma.contract.findMany({
    where: { property: { deletedAt: null, ...companyFilter } },
    select: {
      id: true,
      number: true,
      propertyId: true,
      status: true,
      tenant: { select: { name: true } },
      units: { select: { unit: { select: { id: true, code: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const inspections = await prisma.inspection.findMany({
    where: {
      AND: [
        { OR: [{ contract: { property: { deletedAt: null, ...companyFilter } } }, { unit: { property: { deletedAt: null, ...companyFilter } } }] },
        ...(params.empreendimento
          ? [{ OR: [{ contract: { propertyId: params.empreendimento } }, { unit: { propertyId: params.empreendimento } }] }]
          : []),
      ],
    },
    include: {
      contract: { select: { number: true, property: { select: { name: true } }, tenant: { select: { name: true } } } },
      unit: { select: { code: true, property: { select: { name: true } } } },
      items: { select: { answer: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const canManage = roleHasPermission(session.user.role, "inspection:manage");

  return (
    <div>
      <PageHeader
        title="Vistorias"
        description="Checklists de entrada, saída, periódicas e de segurança, com laudo em PDF."
        actions={canManage && properties.length > 0 ? <InspectionFormDialog properties={properties} contracts={contracts} /> : undefined}
      />

      {inspections.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Nenhuma vistoria registrada" description="Crie uma vistoria vinculada a um contrato ou a uma unidade." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Vinculada a</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Não conformidades</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => {
                const propertyName = inspection.contract?.property.name ?? inspection.unit?.property.name ?? "—";
                const linkedTo = inspection.contract
                  ? `Contrato ${inspection.contract.number} — ${inspection.contract.tenant.name}`
                  : inspection.unit
                    ? `Unidade ${inspection.unit.code}`
                    : "—";
                const nonConforming = inspection.items.filter((i) => i.answer === "NAO_CONFORME").length;
                return (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium">{inspectionTypeLabels[inspection.type]}</TableCell>
                    <TableCell className="text-sm">{propertyName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{linkedTo}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inspection.performedAt ? formatDate(inspection.performedAt) : inspection.scheduledAt ? formatDate(inspection.scheduledAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inspection.performedAt ? "default" : "outline"}>
                        {inspection.performedAt ? "Realizada" : "Agendada"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {nonConforming > 0 ? <Badge variant="destructive">{nonConforming}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/vistorias/${inspection.id}`} className="text-sm font-medium text-primary hover:underline">
                        Abrir
                      </Link>
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
