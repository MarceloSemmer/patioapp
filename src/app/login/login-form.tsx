"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const DEMO_USERS = [
  { role: "Superadministrador", email: "superadmin@patiogestor.demo" },
  { role: "Administrador", email: "admin@patiogestor.demo" },
  { role: "Gestor", email: "gestor@patiogestor.demo" },
  { role: "Financeiro", email: "financeiro@patiogestor.demo" },
  { role: "Operacional", email: "operacional@patiogestor.demo" },
  { role: "Consulta", email: "consulta@patiogestor.demo" },
  { role: "Locatário", email: "locatario@patiogestor.demo" },
];

export function LoginForm({ callbackUrl, error }: { callbackUrl?: string; error?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    error ? "Não foi possível entrar. Verifique suas credenciais." : null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setFormError("E-mail ou senha inválidos.");
      return;
    }
    router.push(callbackUrl || "/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse com seu e-mail e senha cadastrados.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@empresa.com.br"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link href="/esqueci-senha" className="text-xs text-primary hover:underline">
                Esqueci minha senha
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {formError && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </Button>
          <details className="w-full rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none font-medium text-foreground">
              Credenciais de demonstração
            </summary>
            <p className="mt-2">
              Todos os usuários de demonstração usam a senha <code className="rounded bg-background px-1 py-0.5">Demo@123</code>.
            </p>
            <ul className="mt-2 space-y-1">
              {DEMO_USERS.map((u) => (
                <li key={u.email} className="flex justify-between gap-2">
                  <span>{u.role}</span>
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setEmail(u.email)}
                  >
                    {u.email}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </CardFooter>
      </form>
    </Card>
  );
}
