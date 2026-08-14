"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { changeOwnPassword } from "@/server/actions/auth-actions";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await changeOwnPassword({ currentPassword, newPassword });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar senha</CardTitle>
        <CardDescription>Use uma senha com pelo menos 8 caracteres.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="currentPassword">Senha atual</Label>
            <Input id="currentPassword" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input id="newPassword" type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="confirm">Confirmar nova senha</Label>
            <Input id="confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Alterar senha
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
