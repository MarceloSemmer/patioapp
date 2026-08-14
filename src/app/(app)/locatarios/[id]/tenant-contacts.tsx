"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { addTenantContact, removeTenantContact } from "@/server/actions/tenant-actions";

interface Contact {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
}

export function TenantContacts({ tenantId, contacts, canManage }: { tenantId: string; contacts: Contact[]; canManage: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addTenantContact({ tenantId, name, role: role || null, phone: phone || null, email: email || null, isPrimary });
      toast.success("Contato adicionado.");
      setOpen(false);
      setName("");
      setRole("");
      setPhone("");
      setEmail("");
      setIsPrimary(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível adicionar o contato.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Contatos</h3>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo contato</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="contact-name">Nome</Label>
                  <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="contact-role">Cargo</Label>
                  <Input id="contact-role" value={role} onChange={(e) => setRole(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="contact-phone">Telefone</Label>
                  <Input id="contact-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="contact-email">E-mail</Label>
                  <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={isPrimary} onCheckedChange={(v) => setIsPrimary(!!v)} /> Contato principal
                </label>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Adicionar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum contato adicional.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-2 border-b pb-2 last:border-0">
              <div>
                <p className="flex items-center gap-1 font-medium">
                  {c.isPrimary && <Star className="h-3 w-3 fill-warning text-warning" />}
                  {c.name}
                  {c.role && <span className="font-normal text-muted-foreground"> · {c.role}</span>}
                </p>
                <p className="text-xs text-muted-foreground">{[c.phone, c.email].filter(Boolean).join(" · ")}</p>
              </div>
              {canManage && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await removeTenantContact(c.id);
                    router.refresh();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
