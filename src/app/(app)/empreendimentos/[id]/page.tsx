import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { propertyStatusColors, propertyStatusLabels } from "@/lib/labels";
import { formatArea, formatDate } from "@/lib/format";
import { roleHasPermission } from "@/lib/permissions";
import { PropertyFormDialog } from "../property-form-dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { OverviewTab } from "./overview-tab";
import { SectorsTab } from "./sectors-tab";
import { IndicatorsTab } from "./indicators-tab";
import Link from "next/link";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const property = await prisma.property.findFirst({
    where: { id, deletedAt: null },
    include: {
      company: { select: { id: true, name: true } },
      sectors: { where: { deletedAt: null }, orderBy: { order: "asc" } },
      _count: { select: { units: true, contracts: true } },
    },
  });

  if (!property) notFound();

  if (session.user.role !== "SUPERADMIN" && !session.user.companyIds.includes(property.companyId)) {
    notFound();
  }

  const canManage = roleHasPermission(session.user.role, "property:manage");

  return (
    <div>
      <Breadcrumbs items={[{ label: "Empreendimentos", href: "/empreendimentos" }, { label: property.name }]} />
      <PageHeader
        title={property.name}
        description={`${property.internalCode} · ${property.company.name}`}
        actions={
          <>
            <Badge variant={propertyStatusColors[property.status]} className="mr-2">
              {propertyStatusLabels[property.status]}
            </Badge>
            {canManage && (
              <PropertyFormDialog
                companies={[{ id: property.company.id, name: property.company.name }]}
                property={{
                  ...property,
                  totalArea: property.totalArea,
                  builtArea: property.builtArea,
                  leasableArea: property.leasableArea,
                }}
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
        <StatCard label="Unidades" value={String(property._count.units)} />
        <StatCard label="Área locável" value={formatArea(property.leasableArea)} />
        <StatCard label="Contratos" value={String(property._count.contracts)} />
        <StatCard label="Setores" value={String(property.sectors.length)} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="sectors">Setores</TabsTrigger>
          <TabsTrigger value="indicators">Indicadores</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab property={property} />
        </TabsContent>
        <TabsContent value="sectors">
          <SectorsTab propertyId={property.id} sectors={property.sectors} canManage={canManage} />
        </TabsContent>
        <TabsContent value="indicators">
          <IndicatorsTab propertyId={property.id} />
        </TabsContent>
      </Tabs>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickLink href={`/unidades?empreendimento=${property.id}`} label="Ver unidades" />
        <QuickLink href={`/contratos?empreendimento=${property.id}`} label="Ver contratos" />
        <QuickLink href={`/manutencao?empreendimento=${property.id}`} label="Ver chamados de manutenção" />
        <QuickLink href={`/documentos?empreendimento=${property.id}`} label="Ver documentos" />
        <QuickLink href={`/financeiro?empreendimento=${property.id}`} label="Ver financeiro" />
        <QuickLink href={`/empreendimentos/${property.id}/planta`} label="Planta interativa" />
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Cadastrado em {formatDate(property.createdAt)} · Última atualização em {formatDate(property.updatedAt)}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="rounded-lg border bg-card p-4 text-sm font-medium transition-colors hover:bg-accent">
      {label} →
    </Link>
  );
}
