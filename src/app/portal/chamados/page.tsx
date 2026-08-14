import { requireTenantContext } from "@/lib/tenant-session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";
import { ticketCategoryLabels, ticketPriorityLabels, ticketStatusLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { PortalTicketFormDialog } from "./portal-ticket-form-dialog";

export default async function PortalTicketsPage() {
  const { tenant } = await requireTenantContext();

  const tickets = await prisma.maintenanceTicket.findMany({
    where: { tenantId: tenant.id },
    include: { unit: { select: { code: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Meus chamados" description="Solicitações de manutenção e ocorrências." actions={<PortalTicketFormDialog />} />
      {tickets.length === 0 ? (
        <EmptyState icon={Wrench} title="Nenhum chamado registrado" description="Abra um chamado para relatar problemas na sua unidade." />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t.protocol}</p>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticketCategoryLabels[t.category]}
                    {t.unit ? ` · ${t.unit.code}` : ""} · Prioridade {ticketPriorityLabels[t.priority]}
                  </p>
                </div>
                <Badge variant="outline">{ticketStatusLabels[t.status]}</Badge>
              </div>
              <p className="mt-2 text-sm">{t.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">Aberto em {formatDate(t.createdAt)}</p>
              {t.resolution && (
                <p className="mt-1 text-xs text-success">Solução: {t.resolution}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
