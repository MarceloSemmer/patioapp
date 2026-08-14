"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Power } from "lucide-react";
import { toggleUserActive } from "@/server/actions/user-actions";

export function ToggleActiveButton({ userId, isActive, disabled }: { userId: string; isActive: boolean; disabled?: boolean }) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={disabled}
      title={disabled ? "Você não pode desativar sua própria conta" : isActive ? "Desativar" : "Ativar"}
      onClick={async () => {
        try {
          await toggleUserActive(userId, !isActive);
          toast.success(isActive ? "Usuário desativado." : "Usuário ativado.");
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o usuário.");
        }
      }}
    >
      <Power className={`h-4 w-4 ${isActive ? "text-destructive" : "text-success"}`} />
    </Button>
  );
}
