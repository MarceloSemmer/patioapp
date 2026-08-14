"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateProposalStatus } from "@/server/actions/proposal-actions";
import type { ProposalStatus } from "@prisma/client";

const NEXT_ACTIONS: Partial<Record<string, { label: string; next: ProposalStatus; variant?: "default" | "destructive" | "outline" }[]>> = {
  RASCUNHO: [{ label: "Enviar proposta", next: "ENVIADA" }],
  ENVIADA: [
    { label: "Iniciar negociação", next: "EM_NEGOCIACAO" },
    { label: "Recusar", next: "RECUSADA", variant: "destructive" },
  ],
  EM_NEGOCIACAO: [
    { label: "Aprovar", next: "APROVADA" },
    { label: "Recusar", next: "RECUSADA", variant: "destructive" },
  ],
};

export function ProposalStatusActions({ proposalId, status }: { proposalId: string; status: string }) {
  const router = useRouter();
  const actions = NEXT_ACTIONS[status] ?? [];

  if (actions.length === 0) return null;

  return (
    <>
      {actions.map((action) => (
        <Button
          key={action.next}
          size="sm"
          variant={action.variant ?? "default"}
          onClick={async () => {
            try {
              await updateProposalStatus(proposalId, action.next);
              toast.success("Status da proposta atualizado.");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Não foi possível atualizar a proposta.");
            }
          }}
        >
          {action.label}
        </Button>
      ))}
    </>
  );
}
