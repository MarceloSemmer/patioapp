"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createInspection } from "@/server/actions/inspection-actions";
import { DEFAULT_CHECKLIST_ITEMS } from "@/lib/inspection-templates";
import { inspectionTypeLabels } from "@/lib/labels";
import type { InspectionType } from "@prisma/client";

interface PropertyOption {
  id: string;
  name: string;
  units: { id: string; code: string }[];
}

interface ContractOption {
  id: string;
  number: string;
  propertyId: string;
  tenant: { name: string };
  units: { unit: { id: string; code: string } }[];
}

export function InspectionFormDialog({ properties, contracts }: { properties: PropertyOption[]; contracts: ContractOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"contrato" | "unidade">("contrato");
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [contractId, setContractId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [type, setType] = useState<InspectionType>("ENTRADA");
  const [scheduledAt, setScheduledAt] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<string[]>(DEFAULT_CHECKLIST_ITEMS.ENTRADA);
  const [newItem, setNewItem] = useState("");

  const contractsForProperty = useMemo(() => contracts.filter((c) => c.propertyId === propertyId), [contracts, propertyId]);
  const selectedProperty = properties.find((p) => p.id === propertyId);

  function handleTypeChange(value: InspectionType) {
    setType(value);
    setItems(DEFAULT_CHECKLIST_ITEMS[value]);
  }

  function addItem() {
    if (!newItem.trim()) return;
    setItems((prev) => [...prev, newItem.trim()]);
    setNewItem("");
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setContractId("");
    setUnitId("");
    setType("ENTRADA");
    setItems(DEFAULT_CHECKLIST_ITEMS.ENTRADA);
    setScheduledAt("");
    setResponsibleName("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Inclua ao menos um item no checklist.");
      return;
    }
    if (mode === "contrato" && !contractId) {
      toast.error("Selecione um contrato.");
      return;
    }
    if (mode === "unidade" && !unitId) {
      toast.error("Selecione uma unidade.");
      return;
    }
    setSubmitting(true);
    try {
      const inspection = await createInspection({
        contractId: mode === "contrato" ? contractId : null,
        unitId: mode === "unidade" ? unitId : null,
        type,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        responsibleName: responsibleName || null,
        notes: notes || null,
        itemLabels: items,
      });
      toast.success("Vistoria criada.");
      setOpen(false);
      resetForm();
      router.push(`/vistorias/${inspection.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar a vistoria.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Nova vistoria
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova vistoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Empreendimento</Label>
            <Select
              value={propertyId}
              onValueChange={(v) => {
                setPropertyId(v);
                setContractId("");
                setUnitId("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="button" size="sm" variant={mode === "contrato" ? "default" : "outline"} onClick={() => setMode("contrato")}>
              Vincular a contrato
            </Button>
            <Button type="button" size="sm" variant={mode === "unidade" ? "default" : "outline"} onClick={() => setMode("unidade")}>
              Vincular a unidade
            </Button>
          </div>

          {mode === "contrato" ? (
            <div>
              <Label>Contrato</Label>
              <Select value={contractId} onValueChange={setContractId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contractsForProperty.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.number} — {c.tenant.name} ({c.units.map((u) => u.unit.code).join(", ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {contractsForProperty.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Nenhum contrato cadastrado para este empreendimento.</p>
              )}
            </div>
          ) : (
            <div>
              <Label>Unidade</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProperty?.units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de vistoria</Label>
              <Select value={type} onValueChange={(v) => handleTypeChange(v as InspectionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(inspectionTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scheduledAt">Agendada para</Label>
              <Input id="scheduledAt" type="date" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="responsibleName">Responsável pela vistoria</Label>
            <Input id="responsibleName" value={responsibleName} onChange={(e) => setResponsibleName(e.target.value)} />
          </div>

          <div>
            <Label>Itens do checklist</Label>
            <div className="space-y-1 rounded-md border p-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-2 text-sm">
                  <span>{item}</span>
                  <button type="button" onClick={() => removeItem(index)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {items.length === 0 && <p className="text-xs text-muted-foreground">Nenhum item adicionado.</p>}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Adicionar item ao checklist"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addItem}>
                Adicionar
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações gerais (opcional)</Label>
            <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar vistoria
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
