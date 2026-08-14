"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="h-14 w-14 text-destructive" />
      <h1 className="text-2xl font-semibold">Ocorreu um erro inesperado</h1>
      <p className="max-w-md text-muted-foreground">
        Algo deu errado ao processar sua solicitação. Tente novamente ou volte para a página anterior.
      </p>
      <Button onClick={() => reset()}>Tentar novamente</Button>
    </div>
  );
}
