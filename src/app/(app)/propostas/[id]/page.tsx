import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileDown } from "lucide-react";
import { proposalStatusColors, proposalStatusLabels, adjustmentIndexLabels, guaranteeTypeLabels } from "@/lib/labels";
import { formatArea, formatCurrency, formatDate } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";
import { ProposalStatusActions } from "./proposal-status-actions";

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const proposal = await prisma.proposal.findFirst({
    where: { id },
    include: {
      property: { select: { id: true, name: true, companyId: true } },
      tenant: { select: { id: true, name: true } },
      units: { include: { unit: { select: { code: true, totalArea: true } } } },
    },
  });

  if (!proposal) notFound();
  if (session.user.role !== "SUPERADMIN" && !session.user.companyIds.includes(proposal.property.companyId)) notFound();

  const canManage = roleHasPermission(session.user.role, "crm:manage");

  return (
    <div>
      <Breadcrumbs items={[{ label: "Propostas", href: "/propostas" }, { label: proposal.number }]} />
      <PageHeader
        title={proposal.number}
        description={`${proposal.tenant.name} · ${proposal.property.name}`}
        actions={
          <>
            <Badge variant={proposalStatusColors[proposal.status]}>{proposalStatusLabels[proposal.status]}</Badge>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/propostas/${proposal.id}/pdf`} target="_blank" rel="noopener noreferrer">
                <FileDown className="h-3.5 w-3.5" /> Baixar PDF
              </a>
            </Button>
            {canManage && <ProposalStatusActions proposalId={proposal.id} status={proposal.status} />}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Info label="Unidades" value={proposal.units.map((u) => u.unit.code).join(", ")} />
        <Info label="Área total" value={formatArea(proposal.totalArea)} />
        <Info label="Aluguel" value={formatCurrency(proposal.rentValue)} />
        <Info label="Condomínio" value={proposal.condoFee ? formatCurrency(proposal.condoFee) : "—"} />
        <Info label="IPTU" value={proposal.iptuFee ? formatCurrency(proposal.iptuFee) : "—"} />
        <Info label="Carência" value={`${proposal.gracePeriodDays} dias`} />
        <Info label="Prazo do contrato" value={`${proposal.contractTermMonths} meses`} />
        <Info label="Índice de reajuste" value={adjustmentIndexLabels[proposal.adjustmentIndex]} />
        <Info label="Garantia" value={guaranteeTypeLabels[proposal.guaranteeType]} />
        <Info label="Valor da garantia" value={proposal.guaranteeValue ? formatCurrency(proposal.guaranteeValue) : "—"} />
        <Info label="Válida até" value={formatDate(proposal.validUntil)} />
      </div>

      {proposal.specialConditions && (
        <div className="mt-4 rounded-lg border bg-card p-4">
          <h3 className="mb-1 text-sm font-medium">Condições especiais</h3>
          <p className="text-sm text-muted-foreground">{proposal.specialConditions}</p>
        </div>
      )}

      {proposal.status === "APROVADA" && canManage && (
        <div className="mt-4 rounded-lg border bg-success/10 p-4">
          <p className="mb-2 text-sm">Proposta aprovada. Você pode convertê-la em contrato.</p>
          <Button asChild>
            <Link href={`/contratos/novo?propostaId=${proposal.id}`}>Converter em contrato</Link>
          </Button>
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
