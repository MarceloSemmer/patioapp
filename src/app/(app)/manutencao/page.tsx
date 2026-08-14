import { requireSession, companyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { roleHasPermission } from "@/lib/permissions";
import { TicketFormDialog } from "./ticket-form-dialog";
import { TicketKanban } from "./ticket-kanban";
import { ticketStatusLabels } from "@/lib/labels";
import type { TicketStatus } from "@prisma/client";

export const metadata = { title: "Manutenção" };

const COLUMN_ORDER: TicketStatus[] = ["ABERTO", "EM_ANALISE", "AGUARDANDO_APROVACAO", "AGUARDANDO_MATERIAL", "EM_EXECUCAO", "CONCLUIDO", "CANCELADO"];

export default async function MaintenancePage({ searchParams }: { searchParams: Promise<{ empreendimento?: string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const companyIds = companyScope(session);

  const properties = await prisma.property.findMany({
    where: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
    select: { id: true, name: true, units: { where: { deletedAt: null }, select: { id: true, code: true } } },
    orderBy: { name: "asc" },
  });

  const tickets = await prisma.maintenanceTicket.findMany({
    where: {
      property: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
      ...(params.empreendimento ? { propertyId: params.empreendimento } : {}),
    },
    include: {
      property: { select: { name: true } },
      unit: { select: { code: true } },
      assignedToUser: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const columns = COLUMN_ORDER.map((status) => ({
    status,
    label: ticketStatusLabels[status],
    tickets: tickets.filter((t) => t.status === status),
  }));

  const avgResolutionDays = (() => {
    const resolved = tickets.filter((t) => t.closedAt);
    if (resolved.length === 0) return 0;
    const totalDays = resolved.reduce((sum, t) => sum + (t.closedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24), 0);
    return totalDays / resolved.length;
  })();

  const canManage = roleHasPermission(session.user.role, "maintenance:manage");

  return (
    <div>
      <PageHeader
        title="Manutenção"
        description={`Tempo médio de atendimento: ${avgResolutionDays.toFixed(1)} dias`}
        actions={canManage && properties.length > 0 ? <TicketFormDialog properties={properties} /> : undefined}
      />
      <TicketKanban columns={columns} canManage={canManage} />
    </div>
  );
}
