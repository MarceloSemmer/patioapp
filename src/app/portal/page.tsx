import { requireTenantContext } from "@/lib/tenant-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency, formatDate } from "@/lib/format";
import { contractStatusColors, contractStatusLabels } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function PortalHomePage() {
  const { tenant } = await requireTenantContext();

  const [activeContract, pendingCharges, openTickets] = await Promise.all([
    prisma.contract.findFirst({
      where: { tenantId: tenant.id, status: { in: ["ATIVO", "EM_CARENCIA", "PROXIMO_VENCIMENTO"] } },
      include: { property: { select: { name: true } }, units: { include: { unit: { select: { code: true } } } } },
      orderBy: { startDate: "desc" },
    }),
    prisma.charge.findMany({
      where: { contract: { tenantId: tenant.id }, status: { in: ["PENDENTE", "VENCIDA", "PARCIALMENTE_PAGA"] } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.maintenanceTicket.count({ where: { tenantId: tenant.id, status: { notIn: ["CONCLUIDO", "CANCELADO"] } } }),
  ]);

  const totalPending = pendingCharges.reduce((sum, c) => sum + Number(c.originalAmount) - Number(c.paidAmount), 0);

  return (
    <div>
      <PageHeader title={`Olá, ${tenant.name}`} description="Acompanhe seu contrato, cobranças e chamados." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Contrato ativo</p>
          {activeContract ? (
            <>
              <p className="mt-1 font-semibold">{activeContract.number}</p>
              <p className="text-xs text-muted-foreground">
                {activeContract.property.name} · {activeContract.units.map((u) => u.unit.code).join(", ")}
              </p>
              <Badge className="mt-2" variant={contractStatusColors[activeContract.status]}>
                {contractStatusLabels[activeContract.status]}
              </Badge>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Nenhum contrato ativo.</p>
          )}
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pendências financeiras</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(totalPending)}</p>
          <Link href="/portal/cobrancas" className="text-xs text-primary hover:underline">
            Ver cobranças
          </Link>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Chamados em aberto</p>
          <p className="mt-1 text-xl font-semibold">{openTickets}</p>
          <Link href="/portal/chamados" className="text-xs text-primary hover:underline">
            Ver chamados
          </Link>
        </div>
      </div>

      {pendingCharges.length > 0 && (
        <div className="mt-6 rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Próximos vencimentos</h3>
          <ul className="space-y-2 text-sm">
            {pendingCharges.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <span>{formatDate(c.dueDate)}</span>
                <span>{formatCurrency(Number(c.originalAmount) - Number(c.paidAmount))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
