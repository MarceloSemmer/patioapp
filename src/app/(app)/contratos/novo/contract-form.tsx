"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createContract } from "@/server/actions/contract-actions";
import { adjustmentIndexLabels, guaranteeTypeLabels, unitStatusLabels } from "@/lib/labels";
import { format, addMonths } from "date-fns";

interface UnitOption {
  id: string;
  code: string;
  totalArea: unknown;
  status: string;
  suggestedRent: unknown;
  condoFee: unknown;
  iptuFee: unknown;
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
interface Prefill {
  proposalId: string;
  propertyId: string;
  tenantId: string;
  unitIds: string[];
  initialValue: number;
  condoFee?: number;
  iptuFee?: number;
  promoFundFee?: number;
  gracePeriodDays: number;
  contractTermMonths: number;
  adjustmentIndex: string;
  guaranteeType: string;
  guaranteeValue?: number;
}

export function ContractForm({ properties, tenants, prefill }: { properties: PropertyOption[]; tenants: TenantOption[]; prefill: Prefill | null }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [propertyId, setPropertyId] = useState(prefill?.propertyId ?? properties[0]?.id ?? "");
  const [tenantId, setTenantId] = useState(prefill?.tenantId ?? tenants[0]?.id ?? "");
  const [unitIds, setUnitIds] = useState<string[]>(prefill?.unitIds ?? []);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(
    format(addMonths(new Date(), prefill?.contractTermMonths ?? 36), "yyyy-MM-dd"),
  );
  const [initialValue, setInitialValue] = useState(prefill ? String(prefill.initialValue) : "");
  const [dueDay, setDueDay] = useState("10");
  const [gracePeriodDays, setGracePeriodDays] = useState(String(prefill?.gracePeriodDays ?? 0));
  const [adjustmentIndex, setAdjustmentIndex] = useState(prefill?.adjustmentIndex ?? "IGPM");
  const [adjustmentPeriodMonths, setAdjustmentPeriodMonths] = useState("12");
  const [condoFee, setCondoFee] = useState(prefill?.condoFee ? String(prefill.condoFee) : "");
  const [iptuFee, setIptuFee] = useState(prefill?.iptuFee ? String(prefill.iptuFee) : "");
  const [promoFundFee, setPromoFundFee] = useState(prefill?.promoFundFee ? String(prefill.promoFundFee) : "");
  const [guaranteeType, setGuaranteeType] = useState(prefill?.guaranteeType ?? "CAUCAO");
  const [guaranteeValue, setGuaranteeValue] = useState(prefill?.guaranteeValue ? String(prefill.guaranteeValue) : "");
  const [guarantorName, setGuarantorName] = useState("");
  const [noticePeriodDays, setNoticePeriodDays] = useState("30");
  const [commercialResponsible, setCommercialResponsible] = useState("");
  const [notes, setNotes] = useState("");

  const selectedProperty = properties.find((p) => p.id === propertyId);

  function toggleUnit(id: string) {
    setUnitIds((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  }

  const totalArea = useMemo(
    () => selectedProperty?.units.filter((u) => unitIds.includes(u.id)).reduce((sum, u) => sum + Number(u.totalArea), 0) ?? 0,
    [selectedProperty, unitIds],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const contract = await createContract({
        propertyId,
        tenantId,
        proposalId: prefill?.proposalId ?? null,
        unitIds,
        type: "LOCACAO_PADRAO",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        initialValue: Number(initialValue),
        dueDay: Number(dueDay),
        gracePeriodDays: Number(gracePeriodDays) || 0,
        adjustmentIndex: adjustmentIndex as never,
        adjustmentPeriodMonths: Number(adjustmentPeriodMonths) || 12,
        condoFee: condoFee ? Number(condoFee) : null,
        iptuFee: iptuFee ? Number(iptuFee) : null,
        promoFundFee: promoFundFee ? Number(promoFundFee) : null,
        otherFees: null,
        guaranteeType: guaranteeType as never,
        guaranteeValue: guaranteeValue ? Number(guaranteeValue) : null,
        guarantorName: guarantorName || null,
        noticePeriodDays: Number(noticePeriodDays) || 30,
        commercialResponsible: commercialResponsible || null,
        notes: notes || null,
      });
      toast.success("Contrato criado como minuta.");
      router.push(`/contratos/${contract.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar o contrato.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
      <Card>
        <CardContent className="grid grid-cols-2 gap-3 p-5">
          <div>
            <Label>Empreendimento</Label>
            <Select value={propertyId} onValueChange={(v) => { setPropertyId(v); setUnitIds([]); }} disabled={!!prefill}>
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
            <Select value={tenantId} onValueChange={setTenantId} disabled={!!prefill}>
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
          <div className="col-span-2">
            <Label>Unidades ({totalArea.toFixed(2)} m² selecionados)</Label>
            <div className="mt-1 max-h-40 overflow-y-auto rounded-md border p-2">
              {selectedProperty?.units.map((u) => (
                <label key={u.id} className="flex items-center gap-2 py-1 text-sm">
                  <Checkbox checked={unitIds.includes(u.id)} onCheckedChange={() => toggleUnit(u.id)} />
                  {u.code} · {Number(u.totalArea).toFixed(2)} m² · {unitStatusLabels[u.status]}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              A validação de conflito de datas com contratos ativos é feita automaticamente ao salvar.
            </p>
          </div>
          <div>
            <Label htmlFor="startDate">Início da vigência</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="endDate">Final da vigência</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="initialValue">Valor inicial do aluguel (R$)</Label>
            <Input id="initialValue" type="number" step="0.01" value={initialValue} onChange={(e) => setInitialValue(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="dueDay">Dia de vencimento</Label>
            <Input id="dueDay" type="number" min={1} max={28} value={dueDay} onChange={(e) => setDueDay(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="gracePeriodDays">Carência (dias)</Label>
            <Input id="gracePeriodDays" type="number" value={gracePeriodDays} onChange={(e) => setGracePeriodDays(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="adjustmentPeriodMonths">Periodicidade do reajuste (meses)</Label>
            <Input id="adjustmentPeriodMonths" type="number" value={adjustmentPeriodMonths} onChange={(e) => setAdjustmentPeriodMonths(e.target.value)} />
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
            <Label htmlFor="condoFee">Condomínio (R$)</Label>
            <Input id="condoFee" type="number" step="0.01" value={condoFee} onChange={(e) => setCondoFee(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="iptuFee">IPTU (R$)</Label>
            <Input id="iptuFee" type="number" step="0.01" value={iptuFee} onChange={(e) => setIptuFee(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="promoFundFee">Fundo de promoção (R$)</Label>
            <Input id="promoFundFee" type="number" step="0.01" value={promoFundFee} onChange={(e) => setPromoFundFee(e.target.value)} />
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
            <Label htmlFor="guarantorName">Fiador (se aplicável)</Label>
            <Input id="guarantorName" value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="noticePeriodDays">Aviso prévio (dias)</Label>
            <Input id="noticePeriodDays" type="number" value={noticePeriodDays} onChange={(e) => setNoticePeriodDays(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="commercialResponsible">Responsável comercial</Label>
            <Input id="commercialResponsible" value={commercialResponsible} onChange={(e) => setCommercialResponsible(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting || unitIds.length === 0}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar contrato (minuta)
        </Button>
      </div>
    </form>
  );
}
