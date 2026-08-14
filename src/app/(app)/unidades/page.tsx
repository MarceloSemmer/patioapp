import { requireSession } from "@/lib/session";
import { companyScope, propertyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DoorOpen } from "lucide-react";
import Link from "next/link";
import { unitStatusColors, unitStatusLabels, unitTypeLabels } from "@/lib/labels";
import { formatArea, formatCurrency } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";
import { UnitFormDialog } from "./unit-form-dialog";
import { UnitFilters } from "./unit-filters";

export const metadata = { title: "Unidades" };

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ empreendimento?: string; status?: string; tipo?: string; q?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const companyIds = companyScope(session);
  const propertyIds = propertyScope(session);

  const properties = await prisma.property.findMany({
    where: {
      deletedAt: null,
      ...(companyIds ? { companyId: { in: companyIds } } : {}),
      ...(propertyIds ? { id: { in: propertyIds } } : {}),
    },
    select: { id: true, name: true, sectors: { where: { deletedAt: null }, select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  const units = await prisma.unit.findMany({
    where: {
      deletedAt: null,
      property: {
        deletedAt: null,
        ...(companyIds ? { companyId: { in: companyIds } } : {}),
        ...(propertyIds ? { id: { in: propertyIds } } : {}),
      },
      ...(params.empreendimento ? { propertyId: params.empreendimento } : {}),
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.tipo ? { type: params.tipo as never } : {}),
      ...(params.q
        ? {
            OR: [
              { code: { contains: params.q, mode: "insensitive" } },
              { commercialName: { contains: params.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { property: { select: { name: true } }, sector: { select: { name: true } } },
    orderBy: [{ property: { name: "asc" } }, { code: "asc" }],
    take: 200,
  });

  const canManage = roleHasPermission(session.user.role, "unit:manage");

  return (
    <div>
      <PageHeader
        title="Unidades"
        description="Salas, lojas, quiosques, boxes e demais espaços locáveis."
        actions={canManage && properties.length > 0 ? <UnitFormDialog properties={properties} /> : undefined}
      />

      <UnitFilters properties={properties.map((p) => ({ id: p.id, name: p.name }))} />

      {units.length === 0 ? (
        <EmptyState icon={DoorOpen} title="Nenhuma unidade encontrada" description="Ajuste os filtros ou cadastre uma nova unidade." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Empreendimento</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Aluguel sugerido</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/unidades/${unit.id}`} className="font-medium hover:underline">
                      {unit.code}
                    </Link>
                    {unit.commercialName && <p className="text-xs text-muted-foreground">{unit.commercialName}</p>}
                  </TableCell>
                  <TableCell>{unit.property.name}</TableCell>
                  <TableCell>{unit.sector?.name ?? "—"}</TableCell>
                  <TableCell>{unitTypeLabels[unit.type]}</TableCell>
                  <TableCell>{formatArea(unit.totalArea)}</TableCell>
                  <TableCell>{unit.suggestedRent ? formatCurrency(unit.suggestedRent) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={unitStatusColors[unit.status]}>{unitStatusLabels[unit.status]}</Badge>
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
