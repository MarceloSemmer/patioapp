import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { generateSystemNotifications } from "@/server/actions/notification-actions";
import { MarkReadButton, MarkAllReadButton } from "./notification-actions-buttons";

export const metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  const session = await requireSession();

  for (const companyId of session.user.companyIds) {
    await generateSystemNotifications(companyId, session.user.id);
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <PageHeader
        title="Notificações"
        description={`${unreadCount} não lida(s)`}
        actions={unreadCount > 0 ? <MarkAllReadButton /> : undefined}
      />

      {notifications.length === 0 ? (
        <EmptyState icon={BellOff} title="Nenhuma notificação" description="Você será avisado sobre vencimentos, cobranças e chamados importantes." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${n.isRead ? "bg-card" : "bg-primary/5 border-primary/30"}`}
            >
              <div className="flex gap-3">
                <Bell className={`mt-0.5 h-4 w-4 shrink-0 ${n.isRead ? "text-muted-foreground" : "text-primary"}`} />
                <div>
                  <Link href={n.linkUrl ?? "#"} className="text-sm font-medium hover:underline">
                    {n.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
              {!n.isRead && <MarkReadButton id={n.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
