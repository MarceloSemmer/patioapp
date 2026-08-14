"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";
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
import { updateUserRoleAndAccess } from "@/server/actions/user-actions";
import { roleLabels } from "@/lib/permissions";
import type { UserRole } from "@prisma/client";

interface Option {
  id: string;
  name: string;
}

export function UserAccessDialog({
  user,
  companies,
  properties,
}: {
  user: { id: string; name: string; role: UserRole; companyIds: string[]; propertyIds: string[] };
  companies: Option[];
  properties: (Option & { companyId: string })[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [companyIds, setCompanyIds] = useState<string[]>(user.companyIds);
  const [propertyIds, setPropertyIds] = useState<string[]>(user.propertyIds);

  const availableProperties = properties.filter((p) => companyIds.includes(p.companyId));

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateUserRoleAndAccess(user.id, { name, role, companyIds, propertyIds });
      toast.success("Acesso atualizado.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o acesso.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Editar acesso">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar acesso — {user.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Perfil</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
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
          <div>
            <Label>Empreendimentos com acesso</Label>
            <div className="mt-1 max-h-24 overflow-y-auto rounded-md border p-2">
              {availableProperties.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-1 text-sm">
                  <Checkbox checked={propertyIds.includes(p.id)} onCheckedChange={() => toggle(propertyIds, setPropertyIds, p.id)} />
                  {p.name}
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
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
