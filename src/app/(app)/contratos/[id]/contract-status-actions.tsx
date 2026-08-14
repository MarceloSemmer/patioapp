"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { changeContractStatus } from "@/server/actions/contract-actions";
import type { ContractStatus } from "@prisma/client";

const NEXT_ACTIONS: Partial<Record<string, { label: string; next: ContractStatus; variant?: "default" | "destructive" | "outline" }[]>> = {
  MINUTA: [{ label: "Enviar para assinatura", next: "EM_ASSINATURA" }],
  EM_ASSINATURA: [{ label: "Ativar contrato", next: "ATIVO" }],
  ATIVO: [
    { label: "Marcar em carência", next: "EM_CARENCIA", variant: "outline" },
    { label: "Encerrar", next: "ENCERRADO", variant: "outline" },
    { label: "Rescindir", next: "RESCINDIDO", variant: "destructive" },
  ],
  EM_CARENCIA: [{ label: "Ativar (fim da carência)", next: "ATIVO" }],
  PROXIMO_VENCIMENTO: [
    { label: "Renovar", next: "RENOVACAO" },
    { label: "Encerrar", next: "ENCERRADO", variant: "outline" },
  ],
  RENOVACAO: [{ label: "Ativar renovação", next: "ATIVO" }],
  SUSPENSO: [{ label: "Reativar", next: "ATIVO" }],
};

export function ContractStatusActions({ contractId, status }: { contractId: string; status: string }) {
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
            if (action.next === "RESCINDIDO" && !confirm("Confirma a rescisão deste contrato?")) return;
            try {
              await changeContractStatus(contractId, action.next);
              toast.success("Status do contrato atualizado.");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o contrato.");
            }
          }}
        >
          {action.label}
        </Button>
      ))}
    </>
  );
}
