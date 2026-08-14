"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createOwner } from "@/server/actions/owner-actions";
import { personTypeLabels } from "@/lib/labels";
import { maskCpfCnpj } from "@/lib/masks";

interface Option {
  id: string;
  name: string;
}
interface UnitOption {
  id: string;
  code: string;
  property: { name: string; companyId: string };
}

export function OwnerFormDialog({ companies, units }: { companies: Option[]; units: UnitOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [personType, setPersonType] = useState("JURIDICA");
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [unitIds, setUnitIds] = useState<string[]>([]);

  const availableUnits = units.filter((u) => u.property.companyId === companyId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createOwner({ companyId, personType: personType as never, name, document, email: email || null, phone: phone || null, unitIds });
      toast.success("Proprietário cadastrado.");
      setOpen(false);
      setName("");
      setDocument("");
      setUnitIds([]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível cadastrar o proprietário.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Novo proprietário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo proprietário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Empresa</Label>
            <Select value={companyId} onValueChange={(v) => { setCompanyId(v); setUnitIds([]); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de pessoa</Label>
            <Select value={personType} onValueChange={setPersonType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(personTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="document">CPF/CNPJ</Label>
            <Input id="document" value={document} onChange={(e) => setDocument(maskCpfCnpj(e.target.value))} required maxLength={18} />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Unidades vinculadas</Label>
            <div className="mt-1 max-h-32 overflow-y-auto rounded-md border p-2">
              {availableUnits.map((u) => (
                <label key={u.id} className="flex items-center gap-2 py-1 text-sm">
                  <Checkbox
                    checked={unitIds.includes(u.id)}
                    onCheckedChange={() => setUnitIds((prev) => (prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id]))}
                  />
                  {u.code} · {u.property.name}
                </label>
              ))}
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
