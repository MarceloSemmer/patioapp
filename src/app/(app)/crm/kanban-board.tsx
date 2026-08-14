"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { moveLeadStage } from "@/server/actions/lead-actions";
import { formatCurrency, formatDate } from "@/lib/format";

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

  async function move(leadId: string, targetStageId: string) {
    try {
      await moveLeadStage(leadId, targetStageId);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível mover o lead.");
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {sorted.map((stage, idx) => (
        <div key={stage.id} className="w-72 shrink-0">
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold">{stage.name}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{stage.leads.length}</span>
          </div>
          <div className="space-y-2">
            {stage.leads.map((lead) => (
              <Card key={lead.id} className="p-3">
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
                {lead.nextActivityAt && (
                  <p className="mt-1 text-xs text-warning">Próxima atividade: {formatDate(lead.nextActivityAt)}</p>
                )}
                {lead.ownerUser && <p className="mt-1 text-xs text-muted-foreground">Resp.: {lead.ownerUser.name}</p>}
                {canManage && (
                  <div className="mt-2 flex justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={idx === 0}
                      onClick={() => move(lead.id, sorted[idx - 1].id)}
                      aria-label="Mover para etapa anterior"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={idx === sorted.length - 1}
                      onClick={() => move(lead.id, sorted[idx + 1].id)}
                      aria-label="Mover para próxima etapa"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
