"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTicketStatus } from "@/server/actions/ticket-actions";
import { ticketCategoryLabels, ticketPriorityLabels, ticketStatusLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { TicketStatus } from "@prisma/client";

interface Ticket {
  id: string;
  protocol: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  dueDate: Date | null;
  property: { name: string };
  unit: { code: string } | null;
  assignedToUser: { name: string } | null;
}

interface Column {
  status: TicketStatus;
  label: string;
  tickets: Ticket[];
}

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "warning" | "destructive"> = {
  BAIXA: "secondary",
  MEDIA: "default",
  ALTA: "warning",
  URGENTE: "destructive",
};

export function TicketKanban({ columns, canManage }: { columns: Column[]; canManage: boolean }) {
  const router = useRouter();

  async function handleMove(ticketId: string, status: TicketStatus) {
    try {
      await updateTicketStatus(ticketId, status);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o chamado.");
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col.status} className="w-72 shrink-0">
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold">{col.label}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{col.tickets.length}</span>
          </div>
          <div className="space-y-2">
            {col.tickets.map((ticket) => (
              <Card key={ticket.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{ticket.protocol}</p>
                  <Badge variant={PRIORITY_VARIANT[ticket.priority]}>{ticketPriorityLabels[ticket.priority]}</Badge>
                </div>
                <p className="mt-1 text-sm font-medium">{ticket.title}</p>
                <p className="text-xs text-muted-foreground">
                  {ticketCategoryLabels[ticket.category]} · {ticket.property.name}
                  {ticket.unit ? ` · ${ticket.unit.code}` : ""}
                </p>
                {ticket.dueDate && <p className="mt-1 text-xs text-warning">Prazo: {formatDate(ticket.dueDate)}</p>}
                {ticket.assignedToUser && <p className="text-xs text-muted-foreground">Resp.: {ticket.assignedToUser.name}</p>}
                {canManage && (
                  <Select value={ticket.status} onValueChange={(v) => handleMove(ticket.id, v as TicketStatus)}>
                    <SelectTrigger className="mt-2 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ticketStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
