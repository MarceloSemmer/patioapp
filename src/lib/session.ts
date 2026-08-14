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
