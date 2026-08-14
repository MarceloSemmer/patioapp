"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUnit, updateUnit, type UnitInput } from "@/server/actions/unit-actions";
import { unitTypeLabels } from "@/lib/labels";

interface PropertyOption {
  id: string;
  name: string;
  sectors: { id: string; name: string }[];
}

interface UnitFormDialogProps {
  properties: PropertyOption[];
  unit?: {
    id: string;
    propertyId: string;
    sectorId: string | null;
    code: string;
    commercialName: string | null;
    type: string;
    privateArea: unknown;
    commonArea: unknown;
    totalArea: unknown;
    suggestedRentPerSqm: unknown;
    suggestedRent: unknown;
    condoFee: unknown;
    iptuFee: unknown;
    promoFundFee: unknown;
    hasElectrical: boolean;
    hasWater: boolean;
    hasGas: boolean;
    hasInternet: boolean;
    hasAccessibility: boolean;
    hasBathroom: boolean;
    technicalNotes: string | null;
    notes: string | null;
  };
  trigger?: React.ReactNode;
}

export function UnitFormDialog({ properties, unit, trigger }: UnitFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!unit;

  const [propertyId, setPropertyId] = useState(unit?.propertyId ?? properties[0]?.id ?? "");
  const [sectorId, setSectorId] = useState(unit?.sectorId ?? "");
  const [code, setCode] = useState(unit?.code ?? "");
  const [commercialName, setCommercialName] = useState(unit?.commercialName ?? "");
  const [type, setType] = useState(unit?.type ?? "LOJA");
  const [privateArea, setPrivateArea] = useState(unit?.privateArea ? String(unit.privateArea) : "");
  const [totalArea, setTotalArea] = useState(unit?.totalArea ? String(unit.totalArea) : "");
  const [suggestedRent, setSuggestedRent] = useState(unit?.suggestedRent ? String(unit.suggestedRent) : "");
  const [condoFee, setCondoFee] = useState(unit?.condoFee ? String(unit.condoFee) : "");
  const [iptuFee, setIptuFee] = useState(unit?.iptuFee ? String(unit.iptuFee) : "");
  const [hasElectrical, setHasElectrical] = useState(unit?.hasElectrical ?? true);
  const [hasWater, setHasWater] = useState(unit?.hasWater ?? true);
  const [hasGas, setHasGas] = useState(unit?.hasGas ?? false);
  const [hasInternet, setHasInternet] = useState(unit?.hasInternet ?? true);
  const [hasAccessibility, setHasAccessibility] = useState(unit?.hasAccessibility ?? false);
  const [hasBathroom, setHasBathroom] = useState(unit?.hasBathroom ?? false);
  const [technicalNotes, setTechnicalNotes] = useState(unit?.technicalNotes ?? "");
  const [notes, setNotes] = useState(unit?.notes ?? "");

  const selectedProperty = properties.find((p) => p.id === propertyId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: UnitInput = {
        propertyId,
        sectorId: sectorId || null,
        code,
        commercialName: commercialName || null,
        type: type as UnitInput["type"],
        privateArea: Number(privateArea),
        commonArea: null,
        totalArea: Number(totalArea),
        frontageWidth: null,
        ceilingHeight: null,
        capacity: null,
        parkingSpaces: null,
        suggestedRentPerSqm: null,
        suggestedRent: suggestedRent ? Number(suggestedRent) : null,
        condoFee: condoFee ? Number(condoFee) : null,
        iptuFee: iptuFee ? Number(iptuFee) : null,
        promoFundFee: null,
        extraFees: null,
        keyMoney: null,
        suggestedDeposit: null,
        allowedSegments: [],
        disallowedSegments: [],
        hasElectrical,
        hasWater,
        hasGas,
        hasExhaustion: false,
        hasInternet,
        hasAccessibility,
        hasBathroom,
        technicalNotes: technicalNotes || null,
        notes: notes || null,
      };

      if (isEdit) {
        await updateUnit(unit.id, payload);
        toast.success("Unidade atualizada.");
      } else {
        await createUnit(payload);
        toast.success("Unidade cadastrada.");
        setCode("");
        setCommercialName("");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar a unidade.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> Nova unidade
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar unidade" : "Nova unidade"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Empreendimento</Label>
              <Select value={propertyId} onValueChange={(v) => { setPropertyId(v); setSectorId(""); }}>
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
            <div>
              <Label>Setor / bloco</Label>
              <Select value={sectorId || "none"} onValueChange={(v) => setSectorId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem setor</SelectItem>
                  {selectedProperty?.sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="code">Código da unidade</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="L-101" />
            </div>
            <div>
              <Label htmlFor="commercialName">Nome comercial</Label>
              <Input id="commercialName" value={commercialName} onChange={(e) => setCommercialName(e.target.value)} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(unitTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div />
            <div>
              <Label htmlFor="privateArea">Área privativa (m²)</Label>
              <Input id="privateArea" type="number" step="0.01" value={privateArea} onChange={(e) => setPrivateArea(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="totalArea">Área total (m²)</Label>
              <Input id="totalArea" type="number" step="0.01" value={totalArea} onChange={(e) => setTotalArea(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="suggestedRent">Aluguel sugerido (R$)</Label>
              <Input id="suggestedRent" type="number" step="0.01" value={suggestedRent} onChange={(e) => setSuggestedRent(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="condoFee">Condomínio (R$)</Label>
              <Input id="condoFee" type="number" step="0.01" value={condoFee} onChange={(e) => setCondoFee(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="iptuFee">IPTU (R$)</Label>
              <Input id="iptuFee" type="number" step="0.01" value={iptuFee} onChange={(e) => setIptuFee(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t pt-3 sm:grid-cols-3">
            <CheckboxField label="Elétrica" checked={hasElectrical} onChange={setHasElectrical} />
            <CheckboxField label="Água" checked={hasWater} onChange={setHasWater} />
            <CheckboxField label="Gás" checked={hasGas} onChange={setHasGas} />
            <CheckboxField label="Internet" checked={hasInternet} onChange={setHasInternet} />
            <CheckboxField label="Acessibilidade" checked={hasAccessibility} onChange={setHasAccessibility} />
            <CheckboxField label="Banheiro" checked={hasBathroom} onChange={setHasBathroom} />
          </div>

          <div>
            <Label htmlFor="technicalNotes">Observações técnicas</Label>
            <Textarea id="technicalNotes" rows={2} value={technicalNotes} onChange={(e) => setTechnicalNotes(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      {label}
    </label>
  );
}
