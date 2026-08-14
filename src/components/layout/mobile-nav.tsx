"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { visibleNavItems } from "./nav-items";
import { portalNavItems } from "./portal-nav-items";
import type { UserRole } from "@prisma/client";

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = useMemo(() => (role === "LOCATARIO" ? portalNavItems : visibleNavItems(role)), [role]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden" aria-label="Abrir menu">
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.href} asChild className={active ? "bg-accent" : undefined}>
              <Link href={item.href} className="flex items-center gap-2">
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
