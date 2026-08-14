"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronsLeft, ChevronsRight, Building2 } from "lucide-react";
import { appConfig } from "@/config/app";
import { visibleNavItems } from "./nav-items";
import { portalNavItems } from "./portal-nav-items";
import type { UserRole } from "@prisma/client";

/**
 * Recebe apenas o `role` (string serializável) em vez da lista de itens já
 * resolvida — ícones (funções de componente) não podem atravessar o limite
 * Server → Client Component no RSC. Os itens de navegação são calculados
 * aqui dentro, no próprio Client Component.
 */
export function Sidebar({ role }: { role: UserRole }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const items = useMemo(() => (role === "LOCATARIO" ? portalNavItems : visibleNavItems(role)), [role]);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r bg-card transition-all duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-4 w-4" />
        </div>
        {!collapsed && <span className="truncate text-sm font-semibold">{appConfig.systemName}</span>}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Navegação principal">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
