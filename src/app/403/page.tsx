import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldAlert className="h-14 w-14 text-destructive" />
      <h1 className="text-2xl font-semibold">Acesso não autorizado</h1>
      <p className="max-w-md text-muted-foreground">
        Você não tem permissão para acessar esta área do sistema. Se acredita que isso é um engano, entre em
        contato com um administrador.
      </p>
      <Button asChild>
        <Link href="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
