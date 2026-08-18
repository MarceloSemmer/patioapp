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
import { inviteUser } from "@/server/actions/user-actions";
import { roleLabels } from "@/lib/permissions";

interface Option {
  id: string;
  name: string;
}

export function InviteUserDialog({ companies, properties }: { companies: Option[]; properties: (Option & { companyId: string })[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("GESTOR");
  const [companyIds, setCompanyIds] = useState<string[]>([]);
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const availableProperties = properties.filter((p) => companyIds.includes(p.companyId));

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await inviteUser({ name, email, role: role as never, companyIds, propertyIds });
      toast.success("Usuário criado.");
      setInviteUrl(result.inviteUrl);
      setEmailConfigured(result.emailConfigured);
      setEmailError(result.emailError ?? null);
      setSubmitted(true);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar o usuário.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setName("");
      setEmail("");
      setCompanyIds([]);
      setPropertyIds([]);
      setInviteUrl(null);
      setEmailError(null);
      setSubmitted(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Convidar usuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar usuário</DialogTitle>
        </DialogHeader>
        {submitted ? (
          <div className="space-y-3">
            {emailConfigured && !emailError ? (
              <p className="text-sm text-muted-foreground">Um e-mail de convite foi enviado para {email}.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {emailError
                    ? `Não foi possível enviar o e-mail (${emailError}). Compartilhe manualmente o link abaixo para o usuário definir a senha:`
                    : "Nenhum provedor de e-mail está configurado neste ambiente. Compartilhe manualmente o link abaixo para o usuário definir a senha (apenas para uso local/demonstração):"}
                </p>
                <p className="break-all rounded-md border bg-muted/50 p-2 text-xs">{inviteUrl}</p>
              </>
            )}
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Concluir</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Perfil</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels)
                    .filter(([value]) => value !== "LOCATARIO")
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Empresas com acesso</Label>
              <div className="mt-1 max-h-24 overflow-y-auto rounded-md border p-2">
                {companies.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 py-1 text-sm">
                    <Checkbox checked={companyIds.includes(c.id)} onCheckedChange={() => toggle(companyIds, setCompanyIds, c.id)} />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
            {(role === "GESTOR" || role === "OPERACIONAL") && (
              <div>
                <Label>Empreendimentos com acesso (se vazio, acessa todos das empresas selecionadas)</Label>
                <div className="mt-1 max-h-24 overflow-y-auto rounded-md border p-2">
                  {availableProperties.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 py-1 text-sm">
                      <Checkbox checked={propertyIds.includes(p.id)} onCheckedChange={() => toggle(propertyIds, setPropertyIds, p.id)} />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar usuário
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
