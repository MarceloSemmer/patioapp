import { requireSession, companyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";
import Link from "next/link";
import { proposalStatusColors, proposalStatusLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";
import { ProposalFormDialog } from "./proposal-form-dialog";

export const metadata = { title: "Propostas" };

export default async function ProposalsPage() {
  const session = await requireSession();
  const companyIds = companyScope(session);

  const proposals = await prisma.proposal.findMany({
    where: { property: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) } },
    include: { property: { select: { name: true } }, tenant: { select: { name: true } }, units: { include: { unit: { select: { code: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const properties = await prisma.property.findMany({
    where: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
    select: {
      id: true,
      name: true,
      units: { where: { deletedAt: null, status: { in: ["DISPONIVEL", "EM_NEGOCIACAO", "RESERVADA"] } }, select: { id: true, code: true, totalArea: true, suggestedRent: true } },
    },
    orderBy: { name: "asc" },
  });

  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const canManage = roleHasPermission(session.user.role, "crm:manage");

  return (
    <div>
      <PageHeader
        title="Propostas comerciais"
        description="Condições comerciais negociadas com potenciais locatários."
        actions={canManage && properties.length > 0 && tenants.length > 0 ? <ProposalFormDialog properties={properties} tenants={tenants} /> : undefined}
      />

      {proposals.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhuma proposta cadastrada" description="Crie propostas a partir de um lead ou diretamente para um locatário." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Locatário</TableHead>
                <TableHead>Empreendimento</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Valor mensal</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/propostas/${p.id}`} className="font-medium hover:underline">
                      {p.number}
                    </Link>
                  </TableCell>
                  <TableCell>{p.tenant.name}</TableCell>
                  <TableCell>{p.property.name}</TableCell>
                  <TableCell>{p.units.map((u) => u.unit.code).join(", ")}</TableCell>
                  <TableCell>{formatCurrency(p.rentValue)}</TableCell>
                  <TableCell>{formatDate(p.validUntil)}</TableCell>
                  <TableCell>
                    <Badge variant={proposalStatusColors[p.status]}>{proposalStatusLabels[p.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
