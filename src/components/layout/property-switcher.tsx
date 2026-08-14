"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setActiveProperty } from "@/server/actions/ui-actions";

interface PropertyOption {
  id: string;
  name: string;
}

export function PropertySwitcher({ properties, activeId }: { properties: PropertyOption[]; activeId: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (properties.length === 0) return null;

  return (
    <Select
      value={activeId ?? "all"}
      disabled={pending}
      onValueChange={(value) => {
        startTransition(async () => {
          await setActiveProperty(value === "all" ? null : value);
          router.refresh();
        });
      }}
    >
      <SelectTrigger className="h-9 w-[220px]">
        <SelectValue placeholder="Todos os empreendimentos" />
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
  );
}
