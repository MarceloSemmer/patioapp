"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { unitStatusLabels, unitTypeLabels } from "@/lib/labels";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

export function UnitFilters({ properties }: { properties: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParam("q", q);
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código ou nome"
          className="w-56 pl-8"
        />
      </form>
      <Select value={searchParams.get("empreendimento") ?? "all"} onValueChange={(v) => updateParam("empreendimento", v)}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Empreendimento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os empreendimentos</SelectItem>
          {properties.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={searchParams.get("status") ?? "all"} onValueChange={(v) => updateParam("status", v)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Situação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as situações</SelectItem>
          {Object.entries(unitStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={searchParams.get("tipo") ?? "all"} onValueChange={(v) => updateParam("tipo", v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          {Object.entries(unitTypeLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
