"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
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
import { createLead } from "@/server/actions/lead-actions";

interface Stage {
  id: string;
  name: string;
}
interface PropertyOption {
  id: string;
  name: string;
}
interface UserOption {
  id: string;
  name: string;
}

export function LeadFormDialog({ stages, properties, users }: { stages: Stage[]; properties: PropertyOption[]; users: UserOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contactName, setContactName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [source, setSource] = useState("");
  const [segmentDesired, setSegmentDesired] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [stageId, setStageId] = useState(stages[0]?.id ?? "");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createLead({
        contactName,
        companyName: companyName || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        source: source || null,
        segmentDesired: segmentDesired || null,
        budgetMin: budgetMin ? Number(budgetMin) : null,
        budgetMax: budgetMax ? Number(budgetMax) : null,
        propertyId: propertyId || null,
        unitId: null,
        ownerUserId: ownerUserId || null,
        stageId,
        nextActivityAt: null,
        notes: notes || null,
      });
      toast.success("Lead cadastrado.");
      setOpen(false);
      setContactName("");
      setCompanyName("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível cadastrar o lead.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Novo lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="contactName">Nome do contato</Label>
              <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
            </div>
            <div className="col-span-2">
              <Label htmlFor="companyName">Empresa</Label>
              <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="contactPhone">Telefone</Label>
              <Input id="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="contactEmail">E-mail</Label>
              <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="source">Origem</Label>
              <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Site, indicação…" />
            </div>
            <div>
              <Label htmlFor="segmentDesired">Segmento pretendido</Label>
              <Input id="segmentDesired" value={segmentDesired} onChange={(e) => setSegmentDesired(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="budgetMin">Investimento mín. (R$)</Label>
              <Input id="budgetMin" type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="budgetMax">Investimento máx. (R$)</Label>
              <Input id="budgetMax" type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
            </div>
            <div>
              <Label>Empreendimento de interesse</Label>
              <Select value={propertyId || "none"} onValueChange={(v) => setPropertyId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={ownerUserId || "none"} onValueChange={(v) => setOwnerUserId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Não atribuído" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não atribuído</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Etapa inicial</Label>
              <Select value={stageId} onValueChange={setStageId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Anotações</Label>
              <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
