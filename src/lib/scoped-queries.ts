import type { Session } from "next-auth";
import { companyScope, propertyScope } from "@/lib/session";
import type { Prisma } from "@prisma/client";

/** Filtro de empresa para modelos que possuem `companyId` diretamente. */
export function companyWhere(session: Session): Prisma.PropertyWhereInput {
  const ids = companyScope(session);
  return ids ? { companyId: { in: ids } } : {};
}

/** Filtro de empreendimento para modelos que possuem `propertyId` diretamente. */
export function propertyWhere(session: Session): { propertyId?: { in: string[] } } {
  const ids = propertyScope(session);
  return ids ? { propertyId: { in: ids } } : {};
}

export function scopedPropertyIdsFilter(session: Session): { in: string[] } | undefined {
  const ids = propertyScope(session);
  return ids ? { in: ids } : undefined;
}
