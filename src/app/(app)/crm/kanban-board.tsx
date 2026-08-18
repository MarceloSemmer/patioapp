"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Phone, Mail, GripVertical } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { moveLeadStage } from "@/server/actions/lead-actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  contactName: string;
  companyName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  segmentDesired: string | null;
  budgetMin: unknown;
  budgetMax: unknown;
  nextActivityAt: Date | null;
  property: { name: string } | null;
  ownerUser: { name: string } | null;
}

interface Stage {
  id: string;
  name: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
  leads: Lead[];
}

export function KanbanBoard({ stages, canManage }: { stages: Stage[]; canManage: boolean }) {
  const router = useRouter();
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function move(leadId: string, targetStageId: string) {
    try {
      await moveLeadStage(leadId, targetStageId);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível mover o lead.");
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const lead = sorted.flatMap((s) => s.leads).find((l) => l.id === event.active.id);
    setActiveLead(lead ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;
    const targetStageId = String(over.id);
    const currentStage = sorted.find((s) => s.leads.some((l) => l.id === active.id));
    if (currentStage && currentStage.id !== targetStageId) {
      move(String(active.id), targetStageId);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sorted.map((stage, idx) => (
          <KanbanColumn key={stage.id} id={stage.id} name={stage.name} count={stage.leads.length}>
            {stage.leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                canManage={canManage}
                onMovePrev={idx > 0 ? () => move(lead.id, sorted[idx - 1].id) : undefined}
                onMoveNext={idx < sorted.length - 1 ? () => move(lead.id, sorted[idx + 1].id) : undefined}
              />
            ))}
          </KanbanColumn>
        ))}
      </div>
      <DragOverlay>{activeLead && <LeadCard lead={activeLead} canManage={false} overlay />}</DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ id, name, count, children }: { id: string; name: string; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="w-72 shrink-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{name}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{count}</span>
      </div>
      <div ref={setNodeRef} className={cn("min-h-[60px] space-y-2 rounded-md p-1 transition-colors", isOver && "bg-accent")}>
        {children}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  canManage,
  onMovePrev,
  onMoveNext,
  overlay,
}: {
  lead: Lead;
  canManage: boolean;
  onMovePrev?: () => void;
  onMoveNext?: () => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id, disabled: !canManage });

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
            aria-label="Arrastar para mover de etapa"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{lead.contactName}</p>
          {lead.companyName && <p className="text-xs text-muted-foreground">{lead.companyName}</p>}
          {lead.segmentDesired && <p className="mt-1 text-xs text-muted-foreground">{lead.segmentDesired}</p>}
          {Boolean(lead.budgetMin || lead.budgetMax) && (
            <p className="text-xs text-muted-foreground">
              {lead.budgetMin ? formatCurrency(lead.budgetMin) : "—"} a {lead.budgetMax ? formatCurrency(lead.budgetMax) : "—"}
            </p>
          )}
          {lead.property && <p className="mt-1 text-xs">{lead.property.name}</p>}
          <div className="mt-1 flex gap-2 text-muted-foreground">
            {lead.contactPhone && <Phone className="h-3 w-3" />}
            {lead.contactEmail && <Mail className="h-3 w-3" />}
          </div>
          {lead.nextActivityAt && <p className="mt-1 text-xs text-warning">Próxima atividade: {formatDate(lead.nextActivityAt)}</p>}
          {lead.ownerUser && <p className="mt-1 text-xs text-muted-foreground">Resp.: {lead.ownerUser.name}</p>}
        </div>
      </div>
      {canManage && (onMovePrev || onMoveNext) && (
        <div className="mt-2 flex justify-between">
          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={!onMovePrev} onClick={onMovePrev} aria-label="Mover para etapa anterior">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={!onMoveNext} onClick={onMoveNext} aria-label="Mover para próxima etapa">
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </Card>
  );
}
