import { requireTenantContext } from "@/lib/tenant-session";
import { PageHeader } from "@/components/layout/page-header";
import { PortalProfileForm } from "./portal-profile-form";
import { ChangePasswordForm } from "@/app/(app)/minha-conta/change-password-form";
import { maskCpfCnpj } from "@/lib/masks";

export default async function PortalProfilePage() {
  const { tenant } = await requireTenantContext();

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title="Meus dados" description="Mantenha seus dados de contato atualizados." />
      <div className="rounded-lg border bg-card p-4 text-sm">
        <p>
          <span className="text-muted-foreground">Razão social / nome:</span> {tenant.name}
        </p>
        <p>
          <span className="text-muted-foreground">Documento:</span> {maskCpfCnpj(tenant.document)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Alterações no nome ou documento devem ser solicitadas à administradora.
        </p>
      </div>
      <PortalProfileForm phone={tenant.phone} whatsapp={tenant.whatsapp} email={tenant.email} />
      <ChangePasswordForm />
    </div>
  );
}
