import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { tenantStatusColors, tenantStatusLabels, personTypeLabels, contractStatusColors, contractStatusLabels, chargeStatusColors, chargeStatusLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";
import { TenantFormDialog } from "../tenant-form-dialog";
import { maskCpfCnpj } from "@/lib/masks";
import { TenantContacts } from "./tenant-contacts";

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const tenant = await prisma.tenant.findFirst({
    where: { id, deletedAt: null },
    include: {
      contacts: { orderBy: { isPrimary: "desc" } },
      contracts: {
        include: { property: { select: { name: true } }, units: { include: { unit: { select: { code: true } } } } },
        orderBy: { createdAt: "desc" },
      },
      proposals: { include: { property: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 10 },
      maintenanceTickets: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!tenant) notFound();
  if (session.user.role !== "SUPERADMIN" && !session.user.companyIds.includes(tenant.companyId)) notFound();

  const charges = await prisma.charge.findMany({
    where: { contract: { tenantId: id } },
    orderBy: { dueDate: "desc" },
    take: 10,
  });

  const canManage = roleHasPermission(session.user.role, "tenant:manage");
  const canViewFinance = roleHasPermission(session.user.role, "finance:view");

  const pendingTotal = charges
    .filter((c) => ["PENDENTE", "VENCIDA", "PARCIALMENTE_PAGA"].includes(c.status))
    .reduce((sum, c) => sum + Number(c.originalAmount) - Number(c.paidAmount), 0);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Locatários", href: "/locatarios" }, { label: tenant.name }]} />
      <PageHeader
        title={tenant.name}
        description={`${maskCpfCnpj(tenant.document)} · ${personTypeLabels[tenant.personType]}`}
        actions={
          <>
            <Badge variant={tenantStatusColors[tenant.status]}>{tenantStatusLabels[tenant.status]}</Badge>
            {canManage && (
              <TenantFormDialog
                companies={[{ id: tenant.companyId, name: "" }]}
                tenant={tenant}
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

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Contratos" value={String(tenant.contracts.length)} />
        <StatCard label="Propostas" value={String(tenant.proposals.length)} />
        <StatCard label="Chamados" value={String(tenant.maintenanceTickets.length)} />
        {canViewFinance && <StatCard label="Pendências" value={formatCurrency(pendingTotal)} highlight={pendingTotal > 0} />}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium">Contratos</h3>
            {tenant.contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum contrato vinculado.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {tenant.contracts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <Link href={`/contratos/${c.id}`} className="font-medium hover:underline">
                        {c.number}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {c.property.name} · {c.units.map((u) => u.unit.code).join(", ")}
                      </p>
                    </div>
                    <Badge variant={contractStatusColors[c.status]}>{contractStatusLabels[c.status]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {canViewFinance && (
            <section className="rounded-lg border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium">Últimas cobranças</h3>
              {charges.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma cobrança gerada.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {charges.map((c) => (
                    <li key={c.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <span>
                        {formatDate(c.dueDate)} · {formatCurrency(c.originalAmount)}
                      </span>
                      <Badge variant={chargeStatusColors[c.status]}>{chargeStatusLabels[c.status]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium">Propostas</h3>
            {tenant.proposals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma proposta registrada.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {tenant.proposals.map((p) => (
                  <li key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <Link href={`/propostas/${p.id}`} className="hover:underline">
                      {p.number} · {p.property.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{formatCurrency(p.rentValue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border bg-card p-4 text-sm">
            <h3 className="mb-3 text-sm font-medium">Dados de contato</h3>
            <InfoRow label="Telefone" value={tenant.phone} />
            <InfoRow label="WhatsApp" value={tenant.whatsapp} />
            <InfoRow label="E-mail" value={tenant.email} />
            <InfoRow label="Segmento" value={tenant.segment} />
          </section>

          <TenantContacts tenantId={tenant.id} contacts={tenant.contacts} canManage={canManage} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${highlight ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}
