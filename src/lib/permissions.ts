import type { UserRole } from "@prisma/client";

/**
 * Definição central de permissões por perfil.
 * A ocultação de botões no frontend é apenas cosmética — toda ação sensível
 * também deve ser validada no servidor (server actions / route handlers)
 * chamando as funções abaixo.
 */

export type Permission =
  | "company:manage"
  | "user:manage"
  | "property:view"
  | "property:manage"
  | "unit:view"
  | "unit:manage"
  | "tenant:view"
  | "tenant:manage"
  | "crm:view"
  | "crm:manage"
  | "proposal:manage"
  | "contract:view"
  | "contract:manage"
  | "finance:view"
  | "finance:manage"
  | "finance:writeoff"
  | "finance:reverse"
  | "maintenance:view"
  | "maintenance:manage"
  | "document:view"
  | "document:manage"
  | "report:view"
  | "settings:manage"
  | "audit:view"
  | "owner:manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPERADMIN: [
    "company:manage",
    "user:manage",
    "property:view",
    "property:manage",
    "unit:view",
    "unit:manage",
    "tenant:view",
    "tenant:manage",
    "crm:view",
    "crm:manage",
    "proposal:manage",
    "contract:view",
    "contract:manage",
    "finance:view",
    "finance:manage",
    "finance:writeoff",
    "finance:reverse",
    "maintenance:view",
    "maintenance:manage",
    "document:view",
    "document:manage",
    "report:view",
    "settings:manage",
    "audit:view",
    "owner:manage",
  ],
  ADMIN: [
    "user:manage",
    "property:view",
    "property:manage",
    "unit:view",
    "unit:manage",
    "tenant:view",
    "tenant:manage",
    "crm:view",
    "crm:manage",
    "proposal:manage",
    "contract:view",
    "contract:manage",
    "finance:view",
    "finance:manage",
    "finance:writeoff",
    "finance:reverse",
    "maintenance:view",
    "maintenance:manage",
    "document:view",
    "document:manage",
    "report:view",
    "settings:manage",
    "audit:view",
    "owner:manage",
  ],
  GESTOR: [
    "property:view",
    "unit:view",
    "unit:manage",
    "tenant:view",
    "tenant:manage",
    "crm:view",
    "crm:manage",
    "proposal:manage",
    "contract:view",
    "contract:manage",
    "finance:view",
    "maintenance:view",
    "maintenance:manage",
    "document:view",
    "document:manage",
    "report:view",
  ],
  FINANCEIRO: [
    "property:view",
    "unit:view",
    "tenant:view",
    "contract:view",
    "finance:view",
    "finance:manage",
    "finance:writeoff",
    "finance:reverse",
    "document:view",
    "report:view",
  ],
  OPERACIONAL: [
    "property:view",
    "unit:view",
    "tenant:view",
    "maintenance:view",
    "maintenance:manage",
    "document:view",
  ],
  CONSULTA: [
    "property:view",
    "unit:view",
    "tenant:view",
    "contract:view",
    "finance:view",
    "maintenance:view",
    "document:view",
    "report:view",
  ],
  LOCATARIO: [],
};

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(role: UserRole, permission: Permission) {
  if (!roleHasPermission(role, permission)) {
    throw new Error(`Acesso negado: o perfil ${role} não possui a permissão "${permission}".`);
  }
}

export const roleLabels: Record<UserRole, string> = {
  SUPERADMIN: "Superadministrador",
  ADMIN: "Administrador",
  GESTOR: "Gestor do empreendimento",
  FINANCEIRO: "Financeiro",
  OPERACIONAL: "Operacional/Manutenção",
  CONSULTA: "Consulta",
  LOCATARIO: "Locatário",
};
