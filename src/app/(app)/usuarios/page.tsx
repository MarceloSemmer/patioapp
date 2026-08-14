import { requireSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { roleLabels } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { InviteUserDialog } from "./invite-user-dialog";
import { UserAccessDialog } from "./user-access-dialog";
import { ToggleActiveButton } from "./toggle-active-button";

export const metadata = { title: "Usuários" };

export default async function UsersPage() {
  const session = await requireSession();
  requirePermission(session.user.role, "user:manage");

  const companies = await prisma.company.findMany({
    where: session.user.role === "SUPERADMIN" ? {} : { id: { in: session.user.companyIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const properties = await prisma.property.findMany({
    where: { deletedAt: null, ...(session.user.role === "SUPERADMIN" ? {} : { companyId: { in: session.user.companyIds } }) },
    select: { id: true, name: true, companyId: true },
    orderBy: { name: "asc" },
  });

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      role: { not: "LOCATARIO" },
      ...(session.user.role === "SUPERADMIN" ? {} : { companies: { some: { companyId: { in: session.user.companyIds } } } }),
    },
    include: { companies: { select: { companyId: true, company: { select: { name: true } } } }, propertyAccess: { select: { propertyId: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Contas internas com acesso ao sistema (não inclui locatários)."
        actions={<InviteUserDialog companies={companies} properties={properties} />}
      />

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Empresas</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{roleLabels[u.role]}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.companies.map((c) => c.company.name).join(", ") || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Nunca"}</TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? "success" : "secondary"}>{u.isActive ? "Ativo" : "Inativo"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <UserAccessDialog
                    user={{
                      id: u.id,
                      name: u.name,
                      role: u.role,
                      companyIds: u.companies.map((c) => c.companyId),
                      propertyIds: u.propertyAccess.map((p) => p.propertyId),
                    }}
                    companies={companies}
                    properties={properties}
                  />
                  <ToggleActiveButton userId={u.id} isActive={u.isActive} disabled={u.id === session.user.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
