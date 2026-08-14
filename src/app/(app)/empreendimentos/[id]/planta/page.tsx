import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { roleHasPermission } from "@/lib/permissions";
import { FloorPlanManager } from "./floor-plan-manager";

export default async function FloorPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const property = await prisma.property.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, name: true, companyId: true },
  });
  if (!property) notFound();
  if (session.user.role !== "SUPERADMIN" && !session.user.companyIds.includes(property.companyId)) notFound();

  const floorPlans = await prisma.floorPlan.findMany({
    where: { propertyId: id },
    include: {
      areas: {
        include: { unit: { select: { id: true, code: true, commercialName: true, status: true, totalArea: true, suggestedRent: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const units = await prisma.unit.findMany({
    where: { propertyId: id, deletedAt: null },
    select: { id: true, code: true, commercialName: true, status: true },
    orderBy: { code: "asc" },
  });

  const canManage = roleHasPermission(session.user.role, "property:manage");

  return (
    <div>
      <Breadcrumbs items={[{ label: "Empreendimentos", href: "/empreendimentos" }, { label: property.name, href: `/empreendimentos/${id}` }, { label: "Planta interativa" }]} />
      <PageHeader title="Planta interativa" description={property.name} />
      <FloorPlanManager propertyId={id} floorPlans={floorPlans} units={units} canManage={canManage} />
    </div>
  );
}
