"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { chargeStatusLabels } from "@/lib/labels";

export function FinanceFilters({
  properties,
  contracts,
}: {
  properties: { id: string; name: string }[];
  contracts: { id: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
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
      <Select value={searchParams.get("contrato") ?? "all"} onValueChange={(v) => updateParam("contrato", v)}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Contrato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os contratos</SelectItem>
          {contracts.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.label}
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
          {Object.entries(chargeStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
