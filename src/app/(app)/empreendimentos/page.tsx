import { requireSession } from "@/lib/session";
import { companyScope, propertyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { propertyStatusColors, propertyStatusLabels } from "@/lib/labels";
import { formatArea } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";
import { PropertyFormDialog } from "./property-form-dialog";

export const metadata = { title: "Empreendimentos" };

export default async function PropertiesPage() {
  const session = await requireSession();
  const companyIds = companyScope(session);
  const propertyIds = propertyScope(session);

  const properties = await prisma.property.findMany({
    where: {
      deletedAt: null,
      ...(companyIds ? { companyId: { in: companyIds } } : {}),
      ...(propertyIds ? { id: { in: propertyIds } } : {}),
    },
    include: {
      _count: { select: { units: true } },
      company: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  const canManage = roleHasPermission(session.user.role, "property:manage");
  const companies = canManage
    ? await prisma.company.findMany({
        where: session.user.role === "SUPERADMIN" ? {} : { id: { in: session.user.companyIds } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Empreendimentos"
        description="Pátios, street malls e centros comerciais administrados."
        actions={canManage && companies.length > 0 ? <PropertyFormDialog companies={companies} /> : undefined}
      />

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum empreendimento cadastrado"
          description="Cadastre o primeiro empreendimento para começar a gerenciar unidades, locatários e contratos."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Link key={property.id} href={`/empreendimentos/${property.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold leading-tight">{property.name}</p>
                      <p className="text-xs text-muted-foreground">{property.internalCode}</p>
                    </div>
                    <Badge variant={propertyStatusColors[property.status]}>
                      {propertyStatusLabels[property.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{property.company.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {property.city ? `${property.city}${property.state ? `/${property.state}` : ""}` : "Endereço não informado"}
                  </p>
                  <div className="flex items-center justify-between border-t pt-3 text-sm">
                    <span>{property._count.units} unidades</span>
                    <span>{formatArea(property.leasableArea)} locável</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
