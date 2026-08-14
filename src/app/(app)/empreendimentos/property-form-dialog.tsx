"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProperty, updateProperty, type PropertyInput } from "@/server/actions/property-actions";
import { propertyStatusLabels } from "@/lib/labels";
import { BRAZILIAN_STATES } from "@/lib/labels";
import { maskCep, maskCnpj, maskPhone } from "@/lib/masks";
import { useCepLookup } from "@/lib/use-cep-lookup";

const formSchema = z.object({
  companyId: z.string().uuid("Selecione a empresa administradora."),
  name: z.string().min(2, "Informe o nome."),
  internalCode: z.string().min(1, "Informe o código interno."),
  cnpj: z.string().optional(),
  municipalRegistry: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  whatsapp: z.string().optional(),
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  totalArea: z.string().min(1, "Informe a área total."),
  builtArea: z.string().optional(),
  leasableArea: z.string().min(1, "Informe a área locável."),
  parkingSpaces: z.string().optional(),
  openingHours: z.string().optional(),
  responsibleName: z.string().optional(),
  description: z.string().optional(),
  amenities: z.string().optional(),
  internalRules: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PropertyFormDialogProps {
  companies: { id: string; name: string }[];
  property?: {
    id: string;
    companyId: string;
    name: string;
    internalCode: string;
    cnpj: string | null;
    municipalRegistry: string | null;
    phone: string | null;
    email: string | null;
    whatsapp: string | null;
    zipCode: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    totalArea: unknown;
    builtArea: unknown;
    leasableArea: unknown;
    parkingSpaces: number | null;
    openingHours: string | null;
    responsibleName: string | null;
    description: string | null;
    amenities: string[];
    internalRules: string | null;
    status: string;
    notes: string | null;
  };
  trigger?: React.ReactNode;
}

export function PropertyFormDialog({ companies, property, trigger }: PropertyFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { lookup, loading: cepLoading } = useCepLookup();
  const isEdit = !!property;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: property
      ? {
          companyId: property.companyId,
          name: property.name,
          internalCode: property.internalCode,
          cnpj: property.cnpj ?? "",
          municipalRegistry: property.municipalRegistry ?? "",
          phone: property.phone ?? "",
          email: property.email ?? "",
          whatsapp: property.whatsapp ?? "",
          zipCode: property.zipCode ?? "",
          street: property.street ?? "",
          number: property.number ?? "",
          complement: property.complement ?? "",
          neighborhood: property.neighborhood ?? "",
          city: property.city ?? "",
          state: property.state ?? "",
          totalArea: String(property.totalArea ?? ""),
          builtArea: property.builtArea ? String(property.builtArea) : "",
          leasableArea: String(property.leasableArea ?? ""),
          parkingSpaces: property.parkingSpaces ? String(property.parkingSpaces) : "",
          openingHours: property.openingHours ?? "",
          responsibleName: property.responsibleName ?? "",
          description: property.description ?? "",
          amenities: property.amenities?.join(", ") ?? "",
          internalRules: property.internalRules ?? "",
          status: property.status,
          notes: property.notes ?? "",
        }
      : {
          companyId: companies[0]?.id ?? "",
          status: "PLANEJAMENTO",
        },
  });

  const zipCode = watch("zipCode");

  async function handleCepBlur() {
    if (!zipCode) return;
    const result = await lookup(zipCode);
    if (result) {
      setValue("street", result.street);
      setValue("neighborhood", result.neighborhood);
      setValue("city", result.city);
      setValue("state", result.state);
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload: PropertyInput = {
        companyId: values.companyId,
        name: values.name,
        internalCode: values.internalCode,
        cnpj: values.cnpj || null,
        municipalRegistry: values.municipalRegistry || null,
        phone: values.phone || null,
        email: values.email || null,
        whatsapp: values.whatsapp || null,
        zipCode: values.zipCode || null,
        street: values.street || null,
        number: values.number || null,
        complement: values.complement || null,
        neighborhood: values.neighborhood || null,
        city: values.city || null,
        state: values.state || null,
        totalArea: Number(values.totalArea),
        builtArea: values.builtArea ? Number(values.builtArea) : null,
        leasableArea: Number(values.leasableArea),
        parkingSpaces: values.parkingSpaces ? Number(values.parkingSpaces) : null,
        openingHours: values.openingHours || null,
        responsibleName: values.responsibleName || null,
        description: values.description || null,
        amenities: values.amenities
          ? values.amenities.split(",").map((a) => a.trim()).filter(Boolean)
          : [],
        internalRules: values.internalRules || null,
        status: values.status as PropertyInput["status"],
        notes: values.notes || null,
      };

      if (isEdit) {
        await updateProperty(property.id, payload);
        toast.success("Empreendimento atualizado com sucesso.");
      } else {
        await createProperty(payload);
        toast.success("Empreendimento cadastrado com sucesso.");
        reset();
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o empreendimento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> Novo empreendimento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar empreendimento" : "Novo empreendimento"}</DialogTitle>
          <DialogDescription>Preencha os dados do pátio, street mall ou centro comercial.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="companyId">Empresa administradora</Label>
              <Select value={watch("companyId")} onValueChange={(v) => setValue("companyId", v)}>
                <SelectTrigger id="companyId">
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
              {errors.companyId && <p className="mt-1 text-xs text-destructive">{errors.companyId.message}</p>}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="status">Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(propertyStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="internalCode">Código interno</Label>
              <Input id="internalCode" {...register("internalCode")} placeholder="EX: PT-001" />
              {errors.internalCode && <p className="mt-1 text-xs text-destructive">{errors.internalCode.message}</p>}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                {...register("cnpj")}
                onChange={(e) => setValue("cnpj", maskCnpj(e.target.value))}
                value={watch("cnpj")}
                maxLength={18}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="municipalRegistry">Inscrição municipal</Label>
              <Input id="municipalRegistry" {...register("municipalRegistry")} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register("phone")}
                onChange={(e) => setValue("phone", maskPhone(e.target.value))}
                value={watch("phone")}
                maxLength={15}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                {...register("whatsapp")}
                onChange={(e) => setValue("whatsapp", maskPhone(e.target.value))}
                value={watch("whatsapp")}
                maxLength={15}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="responsibleName">Responsável</Label>
              <Input id="responsibleName" {...register("responsibleName")} />
            </div>

            <div className="col-span-2 border-t pt-3 text-sm font-medium">Endereço</div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                {...register("zipCode")}
                onChange={(e) => setValue("zipCode", maskCep(e.target.value))}
                onBlur={handleCepBlur}
                value={watch("zipCode")}
                maxLength={9}
                placeholder={cepLoading ? "Buscando..." : "00000-000"}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="number">Número</Label>
              <Input id="number" {...register("number")} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="street">Logradouro</Label>
              <Input id="street" {...register("street")} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="complement">Complemento</Label>
              <Input id="complement" {...register("complement")} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" {...register("neighborhood")} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" {...register("city")} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="state">Estado (UF)</Label>
              <Select value={watch("state") || undefined} onValueChange={(v) => setValue("state", v)}>
                <SelectTrigger id="state">
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

            <div className="col-span-2 border-t pt-3 text-sm font-medium">Áreas e funcionamento</div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="totalArea">Área total (m²)</Label>
              <Input id="totalArea" type="number" step="0.01" {...register("totalArea")} />
              {errors.totalArea && <p className="mt-1 text-xs text-destructive">{errors.totalArea.message}</p>}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="builtArea">Área construída (m²)</Label>
              <Input id="builtArea" type="number" step="0.01" {...register("builtArea")} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="leasableArea">Área locável (m²)</Label>
              <Input id="leasableArea" type="number" step="0.01" {...register("leasableArea")} />
              {errors.leasableArea && <p className="mt-1 text-xs text-destructive">{errors.leasableArea.message}</p>}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="parkingSpaces">Vagas de estacionamento</Label>
              <Input id="parkingSpaces" type="number" {...register("parkingSpaces")} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="openingHours">Horário de funcionamento</Label>
              <Input id="openingHours" {...register("openingHours")} placeholder="Seg a sáb, 9h às 22h" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="amenities">Comodidades (separadas por vírgula)</Label>
              <Input id="amenities" {...register("amenities")} placeholder="Estacionamento, Praça de alimentação" />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" rows={2} {...register("description")} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="internalRules">Regulamento interno</Label>
              <Textarea id="internalRules" rows={2} {...register("internalRules")} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" rows={2} {...register("notes")} />
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
