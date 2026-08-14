"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, CheckCheck } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "@/server/actions/notification-actions";

export function MarkReadButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Marcar como lida"
      onClick={async () => {
        await markNotificationRead(id);
        router.refresh();
      }}
    >
      <Check className="h-4 w-4" />
    </Button>
  );
}

export function MarkAllReadButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await markAllNotificationsRead();
        router.refresh();
      }}
    >
      <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
    </Button>
  );
}
