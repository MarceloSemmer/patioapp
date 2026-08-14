import { requireSession, companyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { chargeStatusColors, chargeStatusLabels, chargeTypeLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";
import { syncOverdueCharges } from "@/server/actions/charge-actions";
import { GenerateChargesDialog } from "./generate-charges-dialog";
import { ChargeActions } from "./charge-actions-menu";
import { FinanceFilters } from "./finance-filters";

export const metadata = { title: "Financeiro" };

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ empreendimento?: string; contrato?: string; status?: string }>;
}) {
  const session = await requireSession();
  requirePermissionView(session.user.role);
  await syncOverdueCharges();

  const params = await searchParams;
  const companyIds = companyScope(session);

  const charges = await prisma.charge.findMany({
    where: {
      contract: {
        property: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
        ...(params.empreendimento ? { propertyId: params.empreendimento } : {}),
      },
      ...(params.contrato ? { contractId: params.contrato } : {}),
      ...(params.status ? { status: params.status as never } : {}),
    },
    include: {
      contract: { select: { number: true, tenant: { select: { name: true } }, property: { select: { name: true } } } },
      items: true,
    },
    orderBy: { dueDate: "desc" },
    take: 300,
  });

  const properties = await prisma.property.findMany({
    where: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const contracts = await prisma.contract.findMany({
    where: { deletedAt: null, property: { ...(companyIds ? { companyId: { in: companyIds } } : {}) } },
    select: { id: true, number: true, tenant: { select: { name: true } } },
    orderBy: { number: "desc" },
    take: 200,
  });

  const canManage = roleHasPermission(session.user.role, "finance:manage");
  const canWriteOff = roleHasPermission(session.user.role, "finance:writeoff");
  const canReverse = roleHasPermission(session.user.role, "finance:reverse");

  const totals = {
    pendente: charges.filter((c) => ["PENDENTE", "EMITIDA"].includes(c.status)).reduce((s, c) => s + Number(c.originalAmount) - Number(c.paidAmount), 0),
    vencida: charges.filter((c) => c.status === "VENCIDA").reduce((s, c) => s + Number(c.originalAmount) - Number(c.paidAmount), 0),
    paga: charges.filter((c) => c.status === "PAGA").reduce((s, c) => s + Number(c.paidAmount), 0),
  };

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Cobranças, pagamentos e controle de inadimplência."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/financeiro/inadimplencia">Régua de inadimplência</Link>
            </Button>
            {canManage && <GenerateChargesDialog contracts={contracts} />}
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Em aberto" value={formatCurrency(totals.pendente)} />
        <SummaryCard label="Vencido" value={formatCurrency(totals.vencida)} highlight />
        <SummaryCard label="Recebido (listado)" value={formatCurrency(totals.paga)} />
      </div>

      <FinanceFilters properties={properties} contracts={contracts.map((c) => ({ id: c.id, label: `${c.number} · ${c.tenant.name}` }))} />

      {charges.length === 0 ? (
        <EmptyState icon={Wallet} title="Nenhuma cobrança encontrada" description="Gere cobranças a partir de um contrato ativo." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Locatário</TableHead>
                <TableHead>Composição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Status</TableHead>
                {(canWriteOff || canReverse) && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.map((charge) => (
                <TableRow key={charge.id}>
                  <TableCell>{formatDate(charge.dueDate)}</TableCell>
                  <TableCell>{charge.contract.number}</TableCell>
                  <TableCell>{charge.contract.tenant.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {charge.items.map((i) => chargeTypeLabels[i.type]).join(", ")}
                  </TableCell>
                  <TableCell>{formatCurrency(charge.originalAmount)}</TableCell>
                  <TableCell>{formatCurrency(charge.paidAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={chargeStatusColors[charge.status]}>{chargeStatusLabels[charge.status]}</Badge>
                  </TableCell>
                  {(canWriteOff || canReverse) && (
                    <TableCell className="text-right">
                      <ChargeActions
                        charge={{ id: charge.id, status: charge.status, originalAmount: Number(charge.originalAmount), paidAmount: Number(charge.paidAmount) }}
                        canWriteOff={canWriteOff}
                        canManage={canManage}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function requirePermissionView(role: string) {
  if (!roleHasPermission(role as never, "finance:view")) {
    throw new Error("Acesso negado.");
  }
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${highlight ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}
