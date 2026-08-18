import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * Retorna os IDs de empresa que o usuário pode enxergar.
 * SUPERADMIN vê todas (representado por null = sem filtro).
 */
export function companyScope(session: Session): string[] | null {
  if (session.user.role === "SUPERADMIN") return null;
  return session.user.companyIds;
}

/**
 * Retorna os IDs de empreendimento que o usuário pode enxergar.
 * SUPERADMIN e ADMIN e FINANCEIRO/CONSULTA enxergam todos os empreendimentos
 * das empresas às quais têm acesso; GESTOR e OPERACIONAL apenas os
 * empreendimentos explicitamente vinculados em UserProperty (quando houver
 * vínculos cadastrados).
 */
export function propertyScope(session: Session): string[] | null {
  if (session.user.role === "SUPERADMIN" || session.user.role === "ADMIN") return null;
  if (session.user.propertyIds.length > 0) return session.user.propertyIds;
  return null;
}

/**
 * Lança um erro se o usuário autenticado não tiver acesso à empresa
 * informada. Deve ser chamado em toda server action que cria/altera um
 * registro vinculado a uma empresa, antes de tocar no banco — nunca confie
 * apenas na ocultação de opções no formulário do cliente.
 */
export function assertCompanyAccess(session: Session, companyId: string) {
  if (session.user.role === "SUPERADMIN") return;
  if (!session.user.companyIds.includes(companyId)) {
    throw new Error("Você não tem acesso a esta empresa.");
  }
}

/**
 * Lança um erro se o usuário autenticado (perfil GESTOR/OPERACIONAL com
 * restrição a empreendimentos específicos) não tiver acesso ao
 * empreendimento informado. Para os demais perfis, o controle já foi feito
 * por `assertCompanyAccess`.
 */
export function assertPropertyAccess(session: Session, propertyId: string) {
  const scope = propertyScope(session);
  if (scope && !scope.includes(propertyId)) {
    throw new Error("Você não tem acesso a este empreendimento.");
  }
}
