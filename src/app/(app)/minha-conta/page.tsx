import { requireSession } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { roleLabels } from "@/lib/permissions";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Minha conta" };

export default async function MyAccountPage() {
  const session = await requireSession();

  return (
    <div className="max-w-lg">
      <PageHeader title="Minha conta" description="Dados de acesso e segurança." />
      <div className="mb-6 rounded-lg border bg-card p-4 text-sm">
        <p>
          <span className="text-muted-foreground">Nome:</span> {session.user.name}
        </p>
        <p>
          <span className="text-muted-foreground">E-mail:</span> {session.user.email}
        </p>
        <p>
          <span className="text-muted-foreground">Perfil:</span> {roleLabels[session.user.role]}
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
