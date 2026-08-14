import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <FileQuestion className="h-14 w-14 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="max-w-md text-muted-foreground">
        O endereço acessado não existe ou foi movido.
      </p>
      <Button asChild>
        <Link href="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
