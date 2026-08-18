import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { contractStatusColors, contractStatusLabels, adjustmentIndexLabels, guaranteeTypeLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";
import { resolveFileUrl } from "@/lib/storage";
import { ContractStatusActions } from "./contract-status-actions";
import { AddendumSection } from "./addendum-section";
import { GenerateChargesDialog } from "../../financeiro/generate-charges-dialog";

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const contract = await prisma.contract.findFirst({
    where: { id, deletedAt: null },
    include: {
      property: { select: { id: true, name: true, companyId: true } },
      tenant: { select: { id: true, name: true } },
      units: { include: { unit: { select: { id: true, code: true, totalArea: true } } } },
      addendums: { orderBy: { effectiveDate: "desc" } },
      adjustments: { orderBy: { baseDate: "desc" } },
    },
  });

  if (!contract) notFound();
  if (session.user.role !== "SUPERADMIN" && !session.user.companyIds.includes(contract.property.companyId)) notFound();

  const canManage = roleHasPermission(session.user.role, "contract:manage");
  const canViewFinance = roleHasPermission(session.user.role, "finance:view");

  const addendumsWithResolvedUrls = await Promise.all(
    contract.addendums.map(async (a) => ({ ...a, fileUrl: a.fileUrl ? await resolveFileUrl(a.fileUrl) : null })),
  );

  const monthlyTotal =
    Number(contract.initialValue) + Number(contract.condoFee ?? 0) + Number(contract.iptuFee ?? 0) + Number(contract.promoFundFee ?? 0) + Number(contract.otherFees ?? 0);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Contratos", href: "/contratos" }, { label: contract.number }]} />
      <PageHeader
        title={contract.number}
        description={`${contract.tenant.name} · ${contract.property.name}`}
        actions={
          <>
            <Badge variant={contractStatusColors[contract.status]}>{contractStatusLabels[contract.status]}</Badge>
            {canManage && <ContractStatusActions contractId={contract.id} status={contract.status} />}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Info label="Unidades" value={contract.units.map((u) => u.unit.code).join(", ")} />
        <Info label="Vigência" value={`${formatDate(contract.startDate)} – ${formatDate(contract.endDate)}`} />
        <Info label="Valor mensal total" value={formatCurrency(monthlyTotal)} />
        <Info label="Vencimento" value={`Dia ${contract.dueDay}`} />
        <Info label="Índice de reajuste" value={adjustmentIndexLabels[contract.adjustmentIndex]} />
        <Info label="Próximo reajuste" value={contract.nextAdjustmentDate ? formatDate(contract.nextAdjustmentDate) : "—"} />
        <Info label="Garantia" value={guaranteeTypeLabels[contract.guaranteeType]} />
        <Info label="Valor da garantia" value={contract.guaranteeValue ? formatCurrency(contract.guaranteeValue) : "—"} />
      </div>

      {canViewFinance && (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/financeiro?contrato=${contract.id}`}>Ver cobranças deste contrato</Link>
          </Button>
          {canManage && (
            <GenerateChargesDialog contracts={[{ id: contract.id, number: contract.number, tenant: contract.tenant }]} contractId={contract.id} />
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AddendumSection contractId={contract.id} addendums={addendumsWithResolvedUrls} canManage={canManage} />

        <section className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Reajustes aplicados</h3>
          {contract.adjustments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum reajuste registrado ainda.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {contract.adjustments.map((adj) => (
                <li key={adj.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <span>{formatDate(adj.baseDate)}</span>
                  <span>
                    {formatCurrency(adj.previousValue)} → {formatCurrency(adj.newValue)} ({Number(adj.appliedPercent).toFixed(2)}%)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {contract.notes && (
        <div className="mt-6 rounded-lg border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium">Observações</h3>
          <p className="text-sm text-muted-foreground">{contract.notes}</p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
