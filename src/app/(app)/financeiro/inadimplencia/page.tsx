import { requireSession, companyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/layout/empty-state";
import { AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { appConfig } from "@/config/app";
import { syncOverdueCharges } from "@/server/actions/charge-actions";
import { differenceInCalendarDays } from "date-fns";

export const metadata = { title: "Inadimplência" };

export default async function DelinquencyPage() {
  const session = await requireSession();
  await syncOverdueCharges();
  const companyIds = companyScope(session);

  const overdueCharges = await prisma.charge.findMany({
    where: {
      status: "VENCIDA",
      contract: { property: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) } },
    },
    include: { contract: { select: { number: true, tenant: { select: { name: true } }, property: { select: { name: true } } } } },
    orderBy: { dueDate: "asc" },
  });

  const buckets = appConfig.delinquencyBuckets.map((bucket) => {
    const items = overdueCharges.filter((c) => {
      const days = differenceInCalendarDays(new Date(), c.dueDate);
      return days >= bucket.min && (bucket.max === null || days <= bucket.max);
    });
    return {
      ...bucket,
      items,
      total: items.reduce((sum, c) => sum + Number(c.originalAmount) - Number(c.paidAmount), 0),
    };
  });

  const grandTotal = overdueCharges.reduce((sum, c) => sum + Number(c.originalAmount) - Number(c.paidAmount), 0);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Financeiro", href: "/financeiro" }, { label: "Inadimplência" }]} />
      <PageHeader title="Régua de inadimplência" description={`Total em atraso: ${formatCurrency(grandTotal)}`} />

      {overdueCharges.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Nenhuma cobrança vencida" description="Não há cobranças em atraso no momento." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {buckets.map((bucket) => (
              <div key={bucket.label} className="rounded-lg border bg-card p-3 text-center">
                <p className="text-xs text-muted-foreground">{bucket.label}</p>
                <p className="mt-1 text-lg font-semibold">{bucket.items.length}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(bucket.total)}</p>
              </div>
            ))}
          </div>

          {buckets.map(
            (bucket) =>
              bucket.items.length > 0 && (
                <section key={bucket.label}>
                  <h3 className="mb-2 text-sm font-medium">{bucket.label}</h3>
                  <div className="overflow-hidden rounded-lg border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Locatário</TableHead>
                          <TableHead>Empreendimento</TableHead>
                          <TableHead>Contrato</TableHead>
                          <TableHead>Dias em atraso</TableHead>
                          <TableHead>Valor em aberto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bucket.items.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>{formatDate(c.dueDate)}</TableCell>
                            <TableCell>{c.contract.tenant.name}</TableCell>
                            <TableCell>{c.contract.property.name}</TableCell>
                            <TableCell>{c.contract.number}</TableCell>
                            <TableCell>{differenceInCalendarDays(new Date(), c.dueDate)}</TableCell>
                            <TableCell>{formatCurrency(Number(c.originalAmount) - Number(c.paidAmount))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              ),
          )}
        </div>
      )}
    </div>
  );
}
