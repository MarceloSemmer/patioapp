import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { unitStatusColors, unitStatusLabels, unitTypeLabels } from "@/lib/labels";
import { formatArea, formatCurrency, formatDateTime } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";
import { UnitFormDialog } from "../unit-form-dialog";
import { StatusChangeDialog } from "./status-change-dialog";

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const unit = await prisma.unit.findFirst({
    where: { id, deletedAt: null },
    include: {
      property: { select: { id: true, name: true, companyId: true, sectors: { where: { deletedAt: null }, select: { id: true, name: true } } } },
      sector: { select: { name: true } },
      statusHistory: { orderBy: { changedAt: "desc" }, take: 20 },
      contractUnits: {
        include: { contract: { select: { id: true, number: true, status: true, tenant: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!unit) notFound();
  if (session.user.role !== "SUPERADMIN" && !session.user.companyIds.includes(unit.property.companyId)) notFound();

  const canManage = roleHasPermission(session.user.role, "unit:manage");

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Unidades", href: "/unidades" },
          { label: unit.code },
        ]}
      />
      <PageHeader
        title={`${unit.code}${unit.commercialName ? ` · ${unit.commercialName}` : ""}`}
        description={`${unit.property.name}${unit.sector ? ` · ${unit.sector.name}` : ""}`}
        actions={
          <>
            <Badge variant={unitStatusColors[unit.status]}>{unitStatusLabels[unit.status]}</Badge>
            {canManage && <StatusChangeDialog unitId={unit.id} currentStatus={unit.status} />}
            {canManage && (
              <UnitFormDialog
                properties={[{ id: unit.property.id, name: unit.property.name, sectors: unit.property.sectors }]}
                unit={unit}
                trigger={
                  <Button variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                }
              />
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium">Dados da unidade</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Info label="Tipo" value={unitTypeLabels[unit.type]} />
              <Info label="Área privativa" value={formatArea(unit.privateArea)} />
              <Info label="Área total" value={formatArea(unit.totalArea)} />
              <Info label="Aluguel sugerido" value={unit.suggestedRent ? formatCurrency(unit.suggestedRent) : "—"} />
              <Info label="Condomínio" value={unit.condoFee ? formatCurrency(unit.condoFee) : "—"} />
              <Info label="IPTU" value={unit.iptuFee ? formatCurrency(unit.iptuFee) : "—"} />
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {unit.hasElectrical && <Badge variant="outline">Elétrica</Badge>}
              {unit.hasWater && <Badge variant="outline">Água</Badge>}
              {unit.hasGas && <Badge variant="outline">Gás</Badge>}
              {unit.hasInternet && <Badge variant="outline">Internet</Badge>}
              {unit.hasAccessibility && <Badge variant="outline">Acessibilidade</Badge>}
              {unit.hasBathroom && <Badge variant="outline">Banheiro</Badge>}
            </div>
            {unit.technicalNotes && <p className="mt-3 text-sm text-muted-foreground">{unit.technicalNotes}</p>}
          </section>

          <section className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium">Contratos vinculados</h3>
            {unit.contractUnits.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum contrato vinculado a esta unidade.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {unit.contractUnits.map((cu) => (
                  <li key={cu.contract.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span>
                      {cu.contract.number} · {cu.contract.tenant.name}
                    </span>
                    <Badge variant="outline">{cu.contract.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Histórico de situação</h3>
          {unit.statusHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem histórico registrado.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              {unit.statusHistory.map((h) => (
                <li key={h.id} className="border-l-2 pl-3">
                  <p className="font-medium">
                    {h.previousStatus ? `${unitStatusLabels[h.previousStatus]} → ` : ""}
                    {unitStatusLabels[h.newStatus]}
                  </p>
                  {h.reason && <p className="text-muted-foreground">{h.reason}</p>}
                  <p className="text-xs text-muted-foreground">{formatDateTime(h.changedAt)}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
