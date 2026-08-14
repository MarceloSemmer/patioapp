import { requireSession, companyScope } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRound } from "lucide-react";
import { personTypeLabels } from "@/lib/labels";
import { maskCpfCnpj } from "@/lib/masks";
import { OwnerFormDialog } from "./owner-form-dialog";

export const metadata = { title: "Proprietários" };

export default async function OwnersPage() {
  const session = await requireSession();
  requirePermission(session.user.role, "owner:manage");
  const companyIds = companyScope(session);

  const companies = await prisma.company.findMany({
    where: session.user.role === "SUPERADMIN" ? { ownersModuleEnabled: true } : { id: { in: session.user.companyIds }, ownersModuleEnabled: true },
    select: { id: true, name: true },
  });

  const owners = await prisma.owner.findMany({
    where: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
    include: { units: { include: { unit: { select: { code: true } } } } },
    orderBy: { name: "asc" },
  });

  const units = await prisma.unit.findMany({
    where: { deletedAt: null, property: { ...(companyIds ? { companyId: { in: companyIds } } : {}) } },
    select: { id: true, code: true, property: { select: { name: true, companyId: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Proprietários"
        description="Pessoas físicas ou jurídicas com unidades vinculadas para repasse."
        actions={companies.length > 0 ? <OwnerFormDialog companies={companies} units={units} /> : undefined}
      />
      {companies.length === 0 ? (
        <EmptyState icon={UserRound} title="Módulo desabilitado" description="Ative o módulo de proprietários em Configurações." />
      ) : owners.length === 0 ? (
        <EmptyState icon={UserRound} title="Nenhum proprietário cadastrado" />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Unidades</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell>{maskCpfCnpj(o.document)}</TableCell>
                  <TableCell>{personTypeLabels[o.personType]}</TableCell>
                  <TableCell>{o.units.map((u) => u.unit.code).join(", ") || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
