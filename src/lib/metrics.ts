import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Situações de unidade consideradas "ocupadas" para fins de indicadores.
 * Unidades em carência continuam ocupando a unidade (regra de negócio).
 */
export const OCCUPIED_STATUSES = ["OCUPADA", "EM_CARENCIA"] as const;
export const AVAILABLE_STATUSES = ["DISPONIVEL"] as const;
export const RESERVED_STATUSES = ["RESERVADA", "EM_NEGOCIACAO"] as const;
export const UNAVAILABLE_STATUSES = ["EM_REFORMA", "EM_MANUTENCAO", "BLOQUEADA", "INATIVA"] as const;

export interface OccupancySummary {
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  reservedUnits: number;
  unavailableUnits: number;
  totalArea: number;
  occupiedArea: number;
  availableArea: number;
  occupancyByUnits: number;
  occupancyByArea: number;
}

export async function computeOccupancy(where: Prisma.UnitWhereInput = {}): Promise<OccupancySummary> {
  const units = await prisma.unit.findMany({
    where: { deletedAt: null, ...where },
    select: { status: true, totalArea: true },
  });

  const totalUnits = units.length;
  const totalArea = units.reduce((sum, u) => sum + Number(u.totalArea), 0);

  const occupied = units.filter((u) => (OCCUPIED_STATUSES as readonly string[]).includes(u.status));
  const available = units.filter((u) => (AVAILABLE_STATUSES as readonly string[]).includes(u.status));
  const reserved = units.filter((u) => (RESERVED_STATUSES as readonly string[]).includes(u.status));
  const unavailable = units.filter((u) => (UNAVAILABLE_STATUSES as readonly string[]).includes(u.status));

  const occupiedArea = occupied.reduce((sum, u) => sum + Number(u.totalArea), 0);
  const availableArea = available.reduce((sum, u) => sum + Number(u.totalArea), 0);

  return {
    totalUnits,
    occupiedUnits: occupied.length,
    availableUnits: available.length,
    reservedUnits: reserved.length,
    unavailableUnits: unavailable.length,
    totalArea,
    occupiedArea,
    availableArea,
    occupancyByUnits: totalUnits > 0 ? (occupied.length / totalUnits) * 100 : 0,
    occupancyByArea: totalArea > 0 ? (occupiedArea / totalArea) * 100 : 0,
  };
}
