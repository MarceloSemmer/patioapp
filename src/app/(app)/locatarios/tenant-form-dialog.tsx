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
import { createTenant, updateTenant, type TenantInput } from "@/server/actions/tenant-actions";
import { personTypeLabels, tenantStatusLabels, BRAZILIAN_STATES } from "@/lib/labels";
import { maskCpfCnpj, maskCep, maskPhone } from "@/lib/masks";
import { useCepLookup } from "@/lib/use-cep-lookup";

interface TenantFormDialogProps {
  companies: { id: string; name: string }[];
  tenant?: {
    id: string;
    companyId: string;
    personType: string;
    name: string;
    tradeName: string | null;
    document: string;
    segment: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    zipCode: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    notes: string | null;
    status: string;
  };
  trigger?: React.ReactNode;
}

export function TenantFormDialog({ companies, tenant, trigger }: TenantFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { lookup } = useCepLookup();
  const isEdit = !!tenant;

  const [companyId, setCompanyId] = useState(tenant?.companyId ?? companies[0]?.id ?? "");
  const [personType, setPersonType] = useState(tenant?.personType ?? "JURIDICA");
  const [name, setName] = useState(tenant?.name ?? "");
  const [tradeName, setTradeName] = useState(tenant?.tradeName ?? "");
  const [document, setDocument] = useState(tenant?.document ?? "");
  const [segment, setSegment] = useState(tenant?.segment ?? "");
  const [phone, setPhone] = useState(tenant?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(tenant?.whatsapp ?? "");
  const [email, setEmail] = useState(tenant?.email ?? "");
  const [zipCode, setZipCode] = useState(tenant?.zipCode ?? "");
  const [street, setStreet] = useState(tenant?.street ?? "");
  const [number, setNumber] = useState(tenant?.number ?? "");
  const [neighborhood, setNeighborhood] = useState(tenant?.neighborhood ?? "");
  const [city, setCity] = useState(tenant?.city ?? "");
  const [state, setState] = useState(tenant?.state ?? "");
  const [status, setStatus] = useState(tenant?.status ?? "PROSPECTO");
  const [notes, setNotes] = useState(tenant?.notes ?? "");

  async function handleCepBlur() {
    const result = await lookup(zipCode);
    if (result) {
      setStreet(result.street);
      setNeighborhood(result.neighborhood);
      setCity(result.city);
      setState(result.state);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: TenantInput = {
        companyId,
        personType: personType as TenantInput["personType"],
        name,
        tradeName: tradeName || null,
        document,
        stateRegistration: null,
        segment: segment || null,
        brand: null,
        legalResponsible: null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        website: null,
        zipCode: zipCode || null,
        street: street || null,
        number: number || null,
        complement: null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        billingNotes: null,
        notes: notes || null,
        status: status as TenantInput["status"],
      };
      if (isEdit) {
        await updateTenant(tenant.id, payload);
        toast.success("Locatário atualizado.");
      } else {
        await createTenant(payload);
        toast.success("Locatário cadastrado.");
        setName("");
        setDocument("");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o locatário.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> Novo locatário
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar locatário" : "Novo locatário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Empresa administradora</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
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
              <Label htmlFor="name">{personType === "JURIDICA" ? "Razão social" : "Nome completo"}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="tradeName">Nome fantasia / marca</Label>
              <Input id="tradeName" value={tradeName} onChange={(e) => setTradeName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="document">{personType === "JURIDICA" ? "CNPJ" : "CPF"}</Label>
              <Input id="document" value={document} onChange={(e) => setDocument(maskCpfCnpj(e.target.value))} required maxLength={18} />
            </div>
            <div>
              <Label htmlFor="segment">Segmento de atuação</Label>
              <Input id="segment" value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="Alimentação, moda, serviços…" />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} maxLength={15} />
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} maxLength={15} />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tenantStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 border-t pt-3 text-sm font-medium">Endereço</div>
            <div>
              <Label htmlFor="zipCode">CEP</Label>
              <Input id="zipCode" value={zipCode} onChange={(e) => setZipCode(maskCep(e.target.value))} onBlur={handleCepBlur} maxLength={9} />
            </div>
            <div>
              <Label htmlFor="number">Número</Label>
              <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="street">Logradouro</Label>
              <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label>UF</Label>
              <Select value={state || undefined} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
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
