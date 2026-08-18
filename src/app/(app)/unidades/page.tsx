import { requireSession } from "@/lib/session";
import { companyScope, propertyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { DoorOpen } from "lucide-react";
import { roleHasPermission } from "@/lib/permissions";
import { UnitFormDialog } from "./unit-form-dialog";
import { UnitFilters } from "./unit-filters";
import { UnitsTable } from "./units-table";

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
        <UnitsTable units={units} />
      )}
    </div>
  );
}
