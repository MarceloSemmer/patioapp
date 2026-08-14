import { LayoutDashboard, FileSignature, Wallet, FolderKanban, Wrench, UserCircle } from "lucide-react";
import type { NavItem } from "./nav-items";

export const portalNavItems: NavItem[] = [
  { label: "Início", href: "/portal", icon: LayoutDashboard },
  { label: "Meu contrato", href: "/portal/contrato", icon: FileSignature },
  { label: "Cobranças", href: "/portal/cobrancas", icon: Wallet },
  { label: "Documentos", href: "/portal/documentos", icon: FolderKanban },
  { label: "Chamados", href: "/portal/chamados", icon: Wrench },
  { label: "Meus dados", href: "/portal/perfil", icon: UserCircle },
];
