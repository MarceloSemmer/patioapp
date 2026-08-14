import { requireSession, companyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";
import Link from "next/link";
import { tenantStatusColors, tenantStatusLabels, personTypeLabels } from "@/lib/labels";
import { roleHasPermission } from "@/lib/permissions";
import { TenantFormDialog } from "./tenant-form-dialog";
import { maskCpfCnpj } from "@/lib/masks";

export const metadata = { title: "Locatários" };

export default async function TenantsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const companyIds = companyScope(session);

  const companies = await prisma.company.findMany({
    where: session.user.role === "SUPERADMIN" ? {} : { id: { in: session.user.companyIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const tenants = await prisma.tenant.findMany({
    where: {
      deletedAt: null,
      ...(companyIds ? { companyId: { in: companyIds } } : {}),
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q, mode: "insensitive" } },
              { tradeName: { contains: params.q, mode: "insensitive" } },
              { document: { contains: params.q } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { contracts: true } } },
    orderBy: { name: "asc" },
    take: 200,
  });

  const canManage = roleHasPermission(session.user.role, "tenant:manage");

  return (
    <div>
      <PageHeader
        title="Locatários"
        description="Empresas e pessoas físicas que ocupam ou pretendem ocupar unidades."
        actions={canManage && companies.length > 0 ? <TenantFormDialog companies={companies} /> : undefined}
      />

      {tenants.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum locatário cadastrado" description="Cadastre o primeiro locatário para iniciar propostas e contratos." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Contratos</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <Link href={`/locatarios/${tenant.id}`} className="font-medium hover:underline">
                      {tenant.name}
                    </Link>
                    {tenant.tradeName && <p className="text-xs text-muted-foreground">{tenant.tradeName}</p>}
                  </TableCell>
                  <TableCell>{maskCpfCnpj(tenant.document)}</TableCell>
                  <TableCell>{personTypeLabels[tenant.personType]}</TableCell>
                  <TableCell>{tenant.segment ?? "—"}</TableCell>
                  <TableCell>{tenant._count.contracts}</TableCell>
                  <TableCell>
                    <Badge variant={tenantStatusColors[tenant.status]}>{tenantStatusLabels[tenant.status]}</Badge>
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
