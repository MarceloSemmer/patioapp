import { requireSession, companyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSignature, Plus } from "lucide-react";
import Link from "next/link";
import { contractStatusColors, contractStatusLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";

export const metadata = { title: "Contratos" };

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ empreendimento?: string; status?: string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const companyIds = companyScope(session);

  const contracts = await prisma.contract.findMany({
    where: {
      deletedAt: null,
      property: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
      ...(params.empreendimento ? { propertyId: params.empreendimento } : {}),
      ...(params.status ? { status: params.status as never } : {}),
    },
    include: {
      property: { select: { name: true } },
      tenant: { select: { name: true } },
      units: { include: { unit: { select: { code: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const canManage = roleHasPermission(session.user.role, "contract:manage");

  return (
    <div>
      <PageHeader
        title="Contratos"
        description="Contratos de locação vinculados a unidades e locatários."
        actions={
          canManage ? (
            <Button asChild>
              <Link href="/contratos/novo">
                <Plus className="h-4 w-4" /> Novo contrato
              </Link>
            </Button>
          ) : undefined
        }
      />

      {contracts.length === 0 ? (
        <EmptyState icon={FileSignature} title="Nenhum contrato cadastrado" description="Converta uma proposta aprovada ou crie um contrato diretamente." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Locatário</TableHead>
                <TableHead>Empreendimento</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Valor inicial</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/contratos/${c.id}`} className="font-medium hover:underline">
                      {c.number}
                    </Link>
                  </TableCell>
                  <TableCell>{c.tenant.name}</TableCell>
                  <TableCell>{c.property.name}</TableCell>
                  <TableCell>{c.units.map((u) => u.unit.code).join(", ")}</TableCell>
                  <TableCell>
                    {formatDate(c.startDate)} – {formatDate(c.endDate)}
                  </TableCell>
                  <TableCell>{formatCurrency(c.initialValue)}</TableCell>
                  <TableCell>
                    <Badge variant={contractStatusColors[c.status]}>{contractStatusLabels[c.status]}</Badge>
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
