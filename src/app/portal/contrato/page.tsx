import { requireTenantContext } from "@/lib/tenant-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { FileSignature } from "lucide-react";
import { contractStatusColors, contractStatusLabels, adjustmentIndexLabels, guaranteeTypeLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function PortalContractPage() {
  const { tenant } = await requireTenantContext();

  const contracts = await prisma.contract.findMany({
    where: { tenantId: tenant.id, deletedAt: null },
    include: { property: { select: { name: true } }, units: { include: { unit: { select: { code: true, totalArea: true } } } } },
    orderBy: { startDate: "desc" },
  });

  return (
    <div>
      <PageHeader title="Meu contrato" />
      {contracts.length === 0 ? (
        <EmptyState icon={FileSignature} title="Nenhum contrato encontrado" />
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => {
            const monthlyTotal =
              Number(c.initialValue) + Number(c.condoFee ?? 0) + Number(c.iptuFee ?? 0) + Number(c.promoFundFee ?? 0) + Number(c.otherFees ?? 0);
            return (
              <div key={c.id} className="rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{c.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.property.name} · {c.units.map((u) => u.unit.code).join(", ")}
                    </p>
                  </div>
                  <Badge variant={contractStatusColors[c.status]}>{contractStatusLabels[c.status]}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <Info label="Vigência" value={`${formatDate(c.startDate)} – ${formatDate(c.endDate)}`} />
                  <Info label="Valor mensal" value={formatCurrency(monthlyTotal)} />
                  <Info label="Vencimento" value={`Dia ${c.dueDay}`} />
                  <Info label="Índice de reajuste" value={adjustmentIndexLabels[c.adjustmentIndex]} />
                  <Info label="Garantia" value={guaranteeTypeLabels[c.guaranteeType]} />
                  <Info label="Próximo reajuste" value={c.nextAdjustmentDate ? formatDate(c.nextAdjustmentDate) : "—"} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
