"use client";

import { useMemo, useState } from "react";
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
import { createProposal } from "@/server/actions/proposal-actions";
import { adjustmentIndexLabels, guaranteeTypeLabels } from "@/lib/labels";
import { format, addDays } from "date-fns";

interface UnitOption {
  id: string;
  code: string;
  totalArea: unknown;
  suggestedRent: unknown;
}
interface PropertyOption {
  id: string;
  name: string;
  units: UnitOption[];
}
interface TenantOption {
  id: string;
  name: string;
}

export function ProposalFormDialog({ properties, tenants }: { properties: PropertyOption[]; tenants: TenantOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [rentValue, setRentValue] = useState("");
  const [condoFee, setCondoFee] = useState("");
  const [iptuFee, setIptuFee] = useState("");
  const [gracePeriodDays, setGracePeriodDays] = useState("0");
  const [contractTermMonths, setContractTermMonths] = useState("36");
  const [adjustmentIndex, setAdjustmentIndex] = useState("IGPM");
  const [guaranteeType, setGuaranteeType] = useState("CAUCAO");
  const [guaranteeValue, setGuaranteeValue] = useState("");
  const [validUntil, setValidUntil] = useState(format(addDays(new Date(), 15), "yyyy-MM-dd"));
  const [specialConditions, setSpecialConditions] = useState("");

  const selectedProperty = properties.find((p) => p.id === propertyId);
  const totalArea = useMemo(
    () => selectedProperty?.units.filter((u) => unitIds.includes(u.id)).reduce((sum, u) => sum + Number(u.totalArea), 0) ?? 0,
    [selectedProperty, unitIds],
  );

  function toggleUnit(id: string) {
    setUnitIds((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProposal({
        propertyId,
        tenantId,
        leadId: null,
        unitIds,
        totalArea,
        rentValue: Number(rentValue),
        condoFee: condoFee ? Number(condoFee) : null,
        iptuFee: iptuFee ? Number(iptuFee) : null,
        promoFundFee: null,
        gracePeriodDays: Number(gracePeriodDays) || 0,
        contractTermMonths: Number(contractTermMonths) || 36,
        adjustmentIndex: adjustmentIndex as ProposalInputIndex,
        guaranteeType: guaranteeType as ProposalInputGuarantee,
        guaranteeValue: guaranteeValue ? Number(guaranteeValue) : null,
        validUntil: new Date(validUntil),
        specialConditions: specialConditions || null,
      });
      toast.success("Proposta criada.");
      setOpen(false);
      setUnitIds([]);
      setRentValue("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar a proposta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Nova proposta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova proposta comercial</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Empreendimento</Label>
              <Select value={propertyId} onValueChange={(v) => { setPropertyId(v); setUnitIds([]); }}>
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
              <Label>Locatário</Label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Unidades ({totalArea.toFixed(2)} m² selecionados)</Label>
            <div className="mt-1 max-h-32 overflow-y-auto rounded-md border p-2">
              {selectedProperty?.units.length ? (
                selectedProperty.units.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 py-1 text-sm">
                    <Checkbox checked={unitIds.includes(u.id)} onCheckedChange={() => toggleUnit(u.id)} />
                    {u.code} · {Number(u.totalArea).toFixed(2)} m²
                  </label>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma unidade disponível neste empreendimento.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rentValue">Valor do aluguel (R$)</Label>
              <Input id="rentValue" type="number" step="0.01" value={rentValue} onChange={(e) => setRentValue(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="condoFee">Condomínio (R$)</Label>
              <Input id="condoFee" type="number" step="0.01" value={condoFee} onChange={(e) => setCondoFee(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="iptuFee">IPTU (R$)</Label>
              <Input id="iptuFee" type="number" step="0.01" value={iptuFee} onChange={(e) => setIptuFee(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="gracePeriodDays">Carência (dias)</Label>
              <Input id="gracePeriodDays" type="number" value={gracePeriodDays} onChange={(e) => setGracePeriodDays(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="contractTermMonths">Prazo do contrato (meses)</Label>
              <Input id="contractTermMonths" type="number" value={contractTermMonths} onChange={(e) => setContractTermMonths(e.target.value)} />
            </div>
            <div>
              <Label>Índice de reajuste</Label>
              <Select value={adjustmentIndex} onValueChange={setAdjustmentIndex}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(adjustmentIndexLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Garantia</Label>
              <Select value={guaranteeType} onValueChange={setGuaranteeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(guaranteeTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="guaranteeValue">Valor da garantia (R$)</Label>
              <Input id="guaranteeValue" type="number" step="0.01" value={guaranteeValue} onChange={(e) => setGuaranteeValue(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="validUntil">Válida até</Label>
              <Input id="validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label htmlFor="specialConditions">Condições especiais</Label>
            <Textarea id="specialConditions" rows={2} value={specialConditions} onChange={(e) => setSpecialConditions(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || unitIds.length === 0}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar proposta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ProposalInputIndex = "IPCA" | "IGPM" | "INPC" | "PERCENTUAL_FIXO";
type ProposalInputGuarantee = "CAUCAO" | "FIADOR" | "SEGURO_FIANCA" | "TITULO_CAPITALIZACAO" | "SEM_GARANTIA";
