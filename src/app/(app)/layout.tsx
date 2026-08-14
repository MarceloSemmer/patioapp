import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { companyScope, propertyScope } from "@/lib/session";
import { getActivePropertyId } from "@/lib/active-property";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  const companyIds = companyScope(session);
  const propertyIds = propertyScope(session);

  const properties = await prisma.property.findMany({
    where: {
      deletedAt: null,
      ...(companyIds ? { companyId: { in: companyIds } } : {}),
      ...(propertyIds ? { id: { in: propertyIds } } : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const activePropertyId = await getActivePropertyId();
  const validActiveId = properties.some((p) => p.id === activePropertyId) ? activePropertyId : null;

  const unreadNotifications = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <Sidebar role={session.user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={{ name: session.user.name, email: session.user.email, role: session.user.role }}
          properties={properties}
          activePropertyId={validActiveId}
          unreadNotifications={unreadNotifications}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
