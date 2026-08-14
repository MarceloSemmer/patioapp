import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";
import { GlobalSearch } from "./global-search";
import { PropertySwitcher } from "./property-switcher";
import { MobileNav } from "./mobile-nav";
import type { UserRole } from "@prisma/client";

interface HeaderProps {
  user: { name: string; email: string; role: UserRole };
  properties: { id: string; name: string }[];
  activePropertyId: string | null;
  unreadNotifications: number;
}

export function Header({ user, properties, activePropertyId, unreadNotifications }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4">
      <MobileNav role={user.role} />
      <PropertySwitcher properties={properties} activeId={activePropertyId} />
      <div className="ml-2 flex-1">
        <GlobalSearch />
      </div>
      <Button variant="ghost" size="icon" asChild className="relative" aria-label="Notificações">
        <Link href="/notificacoes">
          <Bell className="h-4 w-4" />
          {unreadNotifications > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </Link>
      </Button>
      <UserMenu name={user.name} email={user.email} role={user.role} />
    </header>
  );
}
