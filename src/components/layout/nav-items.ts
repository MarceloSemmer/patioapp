import type { UserRole } from "@prisma/client";
import type { Permission } from "@/lib/permissions";
import { roleHasPermission } from "@/lib/permissions";
import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  Users,
  KanbanSquare,
  FileText,
  FileSignature,
  Wallet,
  Wrench,
  FolderKanban,
  ClipboardCheck,
  BarChart3,
  Bell,
  UserCog,
  Settings,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Empresas", href: "/empresas", icon: Building2, permission: "company:manage" },
  { label: "Empreendimentos", href: "/empreendimentos", icon: Building2, permission: "property:view" },
  { label: "Unidades", href: "/unidades", icon: DoorOpen, permission: "unit:view" },
  { label: "Locatários", href: "/locatarios", icon: Users, permission: "tenant:view" },
  { label: "CRM / Funil", href: "/crm", icon: KanbanSquare, permission: "crm:view" },
  { label: "Propostas", href: "/propostas", icon: FileText, permission: "crm:view" },
  { label: "Contratos", href: "/contratos", icon: FileSignature, permission: "contract:view" },
  { label: "Financeiro", href: "/financeiro", icon: Wallet, permission: "finance:view" },
  { label: "Manutenção", href: "/manutencao", icon: Wrench, permission: "maintenance:view" },
  { label: "Vistorias", href: "/vistorias", icon: ClipboardCheck, permission: "inspection:view" },
  { label: "Documentos", href: "/documentos", icon: FolderKanban, permission: "document:view" },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3, permission: "report:view" },
  { label: "Notificações", href: "/notificacoes", icon: Bell },
  { label: "Usuários", href: "/usuarios", icon: UserCog, permission: "user:manage" },
  { label: "Auditoria", href: "/auditoria", icon: ShieldCheck, permission: "audit:view" },
  { label: "Proprietários", href: "/proprietarios", icon: UserRound, permission: "owner:manage" },
  { label: "Configurações", href: "/configuracoes", icon: Settings, permission: "settings:manage" },
];

export function visibleNavItems(role: UserRole): NavItem[] {
  return navItems.filter((item) => !item.permission || roleHasPermission(role, item.permission));
}
