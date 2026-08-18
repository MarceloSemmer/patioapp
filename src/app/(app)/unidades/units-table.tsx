"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Scale } from "lucide-react";
import { unitStatusColors, unitStatusLabels, unitTypeLabels } from "@/lib/labels";
import { formatArea, formatCurrency } from "@/lib/format";
import type { UnitStatus, UnitType } from "@prisma/client";

interface UnitRow {
  id: string;
  code: string;
  commercialName: string | null;
  type: UnitType;
  totalArea: unknown;
  suggestedRent: unknown;
  status: UnitStatus;
  property: { name: string };
  sector: { name: string } | null;
}

const MAX_COMPARISON = 4;

export function UnitsTable({ units }: { units: UnitRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((u) => u !== id);
      if (prev.length >= MAX_COMPARISON) return prev;
      return [...prev, id];
    });
  }

  return (
    <div className="pb-16">
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Empreendimento</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Aluguel sugerido</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(unit.id)}
                    disabled={!selected.includes(unit.id) && selected.length >= MAX_COMPARISON}
                    onCheckedChange={() => toggle(unit.id)}
                    aria-label={`Selecionar ${unit.code} para comparação`}
                  />
                </TableCell>
                <TableCell>
                  <Link href={`/unidades/${unit.id}`} className="font-medium hover:underline">
                    {unit.code}
                  </Link>
                  {unit.commercialName && <p className="text-xs text-muted-foreground">{unit.commercialName}</p>}
                </TableCell>
                <TableCell>{unit.property.name}</TableCell>
                <TableCell>{unit.sector?.name ?? "—"}</TableCell>
                <TableCell>{unitTypeLabels[unit.type]}</TableCell>
                <TableCell>{formatArea(unit.totalArea)}</TableCell>
                <TableCell>{unit.suggestedRent ? formatCurrency(unit.suggestedRent) : "—"}</TableCell>
                <TableCell>
                  <Badge variant={unitStatusColors[unit.status]}>{unitStatusLabels[unit.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card p-3 shadow-lg md:left-64">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4">
            <span className="text-sm text-muted-foreground">
              {selected.length} unidade{selected.length > 1 ? "s" : ""} selecionada{selected.length > 1 ? "s" : ""} (máximo {MAX_COMPARISON})
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected([])}>
                Limpar seleção
              </Button>
              <Button
                size="sm"
                disabled={selected.length < 2}
                onClick={() => router.push(`/unidades/comparar?ids=${selected.join(",")}`)}
              >
                <Scale className="h-4 w-4" /> Comparar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
