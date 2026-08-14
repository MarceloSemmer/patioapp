"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/server/actions/auth-actions";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; devResetUrl: string | null; emailConfigured: boolean } | null>(
    null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await requestPasswordReset(email);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Recuperar senha</CardTitle>
            <CardDescription>Informe seu e-mail cadastrado para gerar um link de redefinição.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!result}
                />
              </div>
              {result && (
                <div className="space-y-2 rounded-md border bg-muted/50 p-3 text-sm">
                  <p>{result.message}</p>
                  {!result.emailConfigured && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum provedor de e-mail está configurado neste ambiente (variáveis SMTP_HOST ou
                      RESEND_API_KEY ausentes). Por isso, o link abaixo é exibido diretamente — apenas para uso
                      local/demonstração. Em produção, configure um provedor para que o link seja enviado por
                      e-mail e nunca exibido em tela.
                    </p>
                  )}
                  {result.devResetUrl && (
                    <Link href={result.devResetUrl} className="block break-all text-primary hover:underline">
                      {result.devResetUrl}
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-3">
              {!result && (
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Gerar link de redefinição
                </Button>
              )}
              <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
