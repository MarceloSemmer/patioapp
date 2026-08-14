import { requireSession, companyScope } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { computeOccupancy } from "@/lib/metrics";
import { formatArea, formatPercent } from "@/lib/format";

export const metadata = { title: "Relatórios" };

const REPORTS = [
  { title: "Mapa de ocupação", description: "Todas as unidades com situação atual.", href: "/api/relatorios/ocupacao/csv" },
  { title: "Contratos", description: "Contratos cadastrados com vigência e valores.", href: "/api/relatorios/contratos/csv" },
  { title: "Inadimplência", description: "Cobranças vencidas com dias em atraso.", href: "/api/relatorios/inadimplencia/csv" },
  { title: "Financeiro", description: "Todas as cobranças geradas e seu status.", href: "/api/relatorios/financeiro/csv" },
];

export default async function ReportsPage() {
  const session = await requireSession();
  requirePermission(session.user.role, "report:view");
  const companyIds = companyScope(session);

  const properties = await prisma.property.findMany({
    where: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const occupancyByProperty = await Promise.all(
    properties.map(async (p) => ({ property: p, occupancy: await computeOccupancy({ propertyId: p.id }) })),
  );

  return (
    <div>
      <PageHeader title="Relatórios" description="Exporte dados em CSV para análises externas." />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REPORTS.map((report) => (
          <Card key={report.href}>
            <CardHeader>
              <CardTitle className="text-sm">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <a href={report.href}>
                  <Download className="h-3.5 w-3.5" /> Exportar CSV
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-medium">Vacância e ocupação por empreendimento</h2>
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empreendimento</TableHead>
              <TableHead>Unidades</TableHead>
              <TableHead>Ocupadas</TableHead>
              <TableHead>Disponíveis</TableHead>
              <TableHead>Área total</TableHead>
              <TableHead>Ocupação (área)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {occupancyByProperty.map(({ property, occupancy }) => (
              <TableRow key={property.id}>
                <TableCell className="font-medium">{property.name}</TableCell>
                <TableCell>{occupancy.totalUnits}</TableCell>
                <TableCell>{occupancy.occupiedUnits}</TableCell>
                <TableCell>{occupancy.availableUnits}</TableCell>
                <TableCell>{formatArea(occupancy.totalArea)}</TableCell>
                <TableCell>{formatPercent(occupancy.occupancyByArea)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
