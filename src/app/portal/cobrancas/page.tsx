import { requireTenantContext } from "@/lib/tenant-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet } from "lucide-react";
import { chargeStatusColors, chargeStatusLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/format";
import { syncOverdueCharges } from "@/server/actions/charge-actions";
import { Button } from "@/components/ui/button";

export default async function PortalChargesPage() {
  const { tenant } = await requireTenantContext();
  await syncOverdueCharges();

  const charges = await prisma.charge.findMany({
    where: { contract: { tenantId: tenant.id } },
    include: { contract: { select: { number: true } } },
    orderBy: { dueDate: "desc" },
    take: 100,
  });

  const paymentsByCharge = await prisma.paymentAllocation.findMany({
    where: { chargeId: { in: charges.map((c) => c.id) }, payment: { isReversed: false } },
    select: { chargeId: true, paymentId: true },
  });

  return (
    <div>
      <PageHeader title="Cobranças" description="Aluguel, condomínio, IPTU e demais taxas do seu contrato." />
      {charges.length === 0 ? (
        <EmptyState icon={Wallet} title="Nenhuma cobrança encontrada" />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.map((c) => {
                const payment = paymentsByCharge.find((p) => p.chargeId === c.id);
                return (
                  <TableRow key={c.id}>
                    <TableCell>{formatDate(c.dueDate)}</TableCell>
                    <TableCell>{c.contract.number}</TableCell>
                    <TableCell>{formatCurrency(c.originalAmount)}</TableCell>
                    <TableCell>{formatCurrency(c.paidAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={chargeStatusColors[c.status]}>{chargeStatusLabels[c.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {payment && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/api/financeiro/recibo/${payment.paymentId}/pdf`} target="_blank" rel="noopener noreferrer">
                            Recibo
                          </a>
                        </Button>
                      )}
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
