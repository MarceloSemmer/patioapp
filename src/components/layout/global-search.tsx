"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      className="relative hidden w-full max-w-sm sm:block"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/busca?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar empreendimentos, unidades, locatários…"
        className="pl-8"
        aria-label="Busca global"
      />
    </form>
  );
}
