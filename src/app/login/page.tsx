import { LoginForm } from "./login-form";
import { appConfig } from "@/config/app";
import { Building2 } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">{appConfig.systemName}</h1>
          <p className="text-sm text-muted-foreground">{appConfig.systemDescription}</p>
        </div>
        <LoginForm callbackUrl={params.callbackUrl} error={params.error} />
      </div>
    </div>
  );
}
