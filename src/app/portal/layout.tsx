import { requireTenantContext } from "@/lib/tenant-session";
import { appConfig } from "@/config/app";
import { Building2 } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { session, tenant } = await requireTenantContext();

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <Sidebar role={session.user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
          <MobileNav role={session.user.role} />
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4 text-primary" />
            {tenant.name}
          </div>
          <div className="flex-1" />
          <span className="hidden text-xs text-muted-foreground sm:inline">Portal do locatário · {appConfig.systemName}</span>
          <UserMenu name={session.user.name} email={session.user.email} role={session.user.role} />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
