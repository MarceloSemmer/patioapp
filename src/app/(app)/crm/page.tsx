import { requireSession, companyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { roleHasPermission } from "@/lib/permissions";
import { LeadFormDialog } from "./lead-form-dialog";
import { KanbanBoard } from "./kanban-board";
import { EmptyState } from "@/components/layout/empty-state";
import { KanbanSquare } from "lucide-react";

export const metadata = { title: "CRM / Funil comercial" };

export default async function CrmPage() {
  const session = await requireSession();
  const companyIds = companyScope(session);

  const stages = await prisma.pipelineStage.findMany({
    where: companyIds ? { companyId: { in: companyIds } } : {},
    orderBy: { order: "asc" },
    include: {
      leads: {
        orderBy: { updatedAt: "desc" },
        include: { property: { select: { name: true } }, ownerUser: { select: { name: true } } },
      },
    },
  });

  const properties = await prisma.property.findMany({
    where: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
    select: { id: true, name: true, units: { where: { deletedAt: null }, select: { id: true, code: true } } },
    orderBy: { name: "asc" },
  });

  const users = await prisma.user.findMany({
    where: { deletedAt: null, isActive: true, ...(companyIds ? { companies: { some: { companyId: { in: companyIds } } } } : {}) },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const canManage = roleHasPermission(session.user.role, "crm:manage");

  return (
    <div>
      <PageHeader
        title="CRM / Funil comercial"
        description="Prospecção de novos locatários e acompanhamento de negociações."
        actions={canManage && stages.length > 0 ? <LeadFormDialog stages={stages} properties={properties} users={users} /> : undefined}
      />

      {stages.length === 0 ? (
        <EmptyState icon={KanbanSquare} title="Funil não configurado" description="Configure as etapas do funil comercial em Configurações." />
      ) : (
        <KanbanBoard stages={stages} canManage={canManage} />
      )}
    </div>
  );
}
