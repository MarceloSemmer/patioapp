import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CompanyFormDialog } from "./company-form-dialog";

export const metadata = { title: "Empresas administradoras" };

export default async function CompaniesPage() {
  const session = await requireSession();
  if (session.user.role !== "SUPERADMIN") redirect("/403");

  const companies = await prisma.company.findMany({
    include: { _count: { select: { properties: true, tenants: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Empresas administradoras" description="Empresas que utilizam a plataforma." actions={<CompanyFormDialog />} />
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Empreendimentos</TableHead>
              <TableHead>Locatários</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  {c.name} {c.isDemo && <Badge variant="outline" className="ml-2">demo</Badge>}
                </TableCell>
                <TableCell>{c.cnpj ?? "—"}</TableCell>
                <TableCell>{c._count.properties}</TableCell>
                <TableCell>{c._count.tenants}</TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? "success" : "secondary"}>{c.isActive ? "Ativa" : "Inativa"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
