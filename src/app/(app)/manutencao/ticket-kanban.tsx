"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTicketStatus } from "@/server/actions/ticket-actions";
import { ticketCategoryLabels, ticketPriorityLabels, ticketStatusLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
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
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function handleMove(ticketId: string, status: TicketStatus) {
    try {
      await updateTicketStatus(ticketId, status);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o chamado.");
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const ticket = columns.flatMap((c) => c.tickets).find((t) => t.id === event.active.id);
    setActiveTicket(ticket ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;
    const targetStatus = String(over.id) as TicketStatus;
    const currentColumn = columns.find((c) => c.tickets.some((t) => t.id === active.id));
    if (currentColumn && currentColumn.status !== targetStatus) {
      handleMove(String(active.id), targetStatus);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <KanbanColumn key={col.status} id={col.status} label={col.label} count={col.tickets.length}>
            {col.tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} canManage={canManage} onMove={(status) => handleMove(ticket.id, status)} />
            ))}
          </KanbanColumn>
        ))}
      </div>
      <DragOverlay>{activeTicket && <TicketCard ticket={activeTicket} canManage={false} onMove={() => {}} overlay />}</DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ id, label, count, children }: { id: string; label: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="w-72 shrink-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{count}</span>
      </div>
      <div ref={setNodeRef} className={cn("min-h-[60px] space-y-2 rounded-md p-1 transition-colors", isOver && "bg-accent")}>
        {children}
      </div>
    </div>
  );
}

function TicketCard({
  ticket,
  canManage,
  onMove,
  overlay,
}: {
  ticket: Ticket;
  canManage: boolean;
  onMove: (status: TicketStatus) => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id, disabled: !canManage });

  return (
    <Card
      ref={setNodeRef}
      className={cn("p-3", isDragging && "opacity-40", overlay && "shadow-lg")}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
    >
      <div className="flex items-start gap-2">
        {canManage && (
          <button
            type="button"
            {...listeners}
            {...attributes}
            className="mt-0.5 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
            aria-label="Arrastar para mover de situação"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
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
            <Select value={ticket.status} onValueChange={(v) => onMove(v as TicketStatus)}>
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
        </div>
      </div>
    </Card>
  );
}
