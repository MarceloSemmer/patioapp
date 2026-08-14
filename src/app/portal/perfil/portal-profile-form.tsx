"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateOwnTenantContact } from "@/server/actions/tenant-actions";
import { maskPhone } from "@/lib/masks";

export function PortalProfileForm({ phone, whatsapp, email }: { phone: string | null; whatsapp: string | null; email: string | null }) {
  const [phoneValue, setPhoneValue] = useState(phone ?? "");
  const [whatsappValue, setWhatsappValue] = useState(whatsapp ?? "");
  const [emailValue, setEmailValue] = useState(email ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateOwnTenantContact({ phone: phoneValue || null, whatsapp: whatsappValue || null, email: emailValue || null });
      toast.success("Dados de contato atualizados.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar seus dados.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados de contato</CardTitle>
        <CardDescription>Telefone, WhatsApp e e-mail para comunicados.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phoneValue} onChange={(e) => setPhoneValue(maskPhone(e.target.value))} maxLength={15} />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" value={whatsappValue} onChange={(e) => setWhatsappValue(maskPhone(e.target.value))} maxLength={15} />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
