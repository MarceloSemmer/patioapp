import { requireSession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { appConfig } from "@/config/app";
import { CompanySettingsForm } from "./company-settings-form";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const session = await requireSession();
  requirePermission(session.user.role, "settings:manage");

  const companies = await prisma.company.findMany({
    where: session.user.role === "SUPERADMIN" ? {} : { id: { in: session.user.companyIds } },
    include: { settings: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Configurações" description="Parâmetros da empresa administradora e do sistema." />

      <div className="rounded-lg border bg-card p-4 text-sm">
        <h3 className="mb-2 font-medium">Sistema</h3>
        <p>
          <span className="text-muted-foreground">Nome do sistema:</span> {appConfig.systemName}
        </p>
        <p>
          <span className="text-muted-foreground">Fuso horário padrão:</span> {appConfig.timezone}
        </p>
        <p>
          <span className="text-muted-foreground">Moeda:</span> {appConfig.currency} ({appConfig.currencySymbol})
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          O nome do sistema é definido centralmente em <code>src/config/app.ts</code>.
        </p>
      </div>

      {companies.map((company) => (
        <CompanySettingsForm
          key={company.id}
          company={{
            id: company.id,
            name: company.name,
            ownersModuleEnabled: company.ownersModuleEnabled,
            contractNumberPrefix: company.settings?.contractNumberPrefix ?? "CT",
            proposalNumberPrefix: company.settings?.proposalNumberPrefix ?? "PR",
            ticketNumberPrefix: company.settings?.ticketNumberPrefix ?? "CH",
            contractAlertDays: company.settings?.contractAlertDays ?? [180, 120, 90, 60, 30],
          }}
        />
      ))}
    </div>
  );
}
