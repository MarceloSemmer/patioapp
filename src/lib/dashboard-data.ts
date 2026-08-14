import { prisma } from "@/lib/prisma";
import { computeOccupancy } from "@/lib/metrics";
import { subMonths, startOfMonth, endOfMonth, addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Prisma } from "@prisma/client";

export interface DashboardFilters {
  companyIds: string[] | null;
  propertyId?: string | null;
}

function propertyWhere(filters: DashboardFilters): Prisma.PropertyWhereInput {
  return {
    deletedAt: null,
    ...(filters.companyIds ? { companyId: { in: filters.companyIds } } : {}),
    ...(filters.propertyId ? { id: filters.propertyId } : {}),
  };
}

export async function getDashboardData(filters: DashboardFilters) {
  const propertyScope = propertyWhere(filters);

  const properties = await prisma.property.findMany({ where: propertyScope, select: { id: true, name: true } });
  const propertyIds = properties.map((p) => p.id);

  const occupancy = await computeOccupancy({ propertyId: { in: propertyIds } });

  const [reservedCount, maintenanceCount, contractsActiveOrGrace] = await Promise.all([
    prisma.unit.count({ where: { deletedAt: null, propertyId: { in: propertyIds }, status: { in: ["RESERVADA", "EM_NEGOCIACAO"] } } }),
    prisma.unit.count({ where: { deletedAt: null, propertyId: { in: propertyIds }, status: { in: ["EM_MANUTENCAO", "EM_REFORMA"] } } }),
    prisma.contract.findMany({
      where: { deletedAt: null, propertyId: { in: propertyIds }, status: { in: ["ATIVO", "EM_CARENCIA", "PROXIMO_VENCIMENTO", "RENOVACAO"] } },
      select: { id: true, initialValue: true, condoFee: true, iptuFee: true, promoFundFee: true, otherFees: true, endDate: true },
    }),
  ]);

  const monthlyContractedRevenue = contractsActiveOrGrace.reduce(
    (sum, c) => sum + Number(c.initialValue) + Number(c.condoFee ?? 0) + Number(c.iptuFee ?? 0) + Number(c.promoFundFee ?? 0) + Number(c.otherFees ?? 0),
    0,
  );

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [receivedThisMonth, overdueCharges, negotiatingProposals, openTickets] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        isReversed: false,
        paidAt: { gte: monthStart, lte: monthEnd },
        allocations: { some: { charge: { contract: { propertyId: { in: propertyIds } } } } },
      },
    }),
    prisma.charge.findMany({
      where: { status: "VENCIDA", contract: { propertyId: { in: propertyIds } } },
      select: { originalAmount: true, paidAmount: true },
    }),
    prisma.proposal.count({ where: { propertyId: { in: propertyIds }, status: "EM_NEGOCIACAO" } }),
    prisma.maintenanceTicket.count({ where: { propertyId: { in: propertyIds }, status: { in: ["ABERTO", "EM_ANALISE", "AGUARDANDO_APROVACAO", "AGUARDANDO_MATERIAL", "EM_EXECUCAO"] } } }),
  ]);

  const overdueTotal = overdueCharges.reduce((sum, c) => sum + Number(c.originalAmount) - Number(c.paidAmount), 0);

  const totalBilledLast90 = await prisma.charge.aggregate({
    _sum: { originalAmount: true },
    where: { contract: { propertyId: { in: propertyIds } }, dueDate: { gte: subMonths(now, 3) }, status: { not: "CANCELADA" } },
  });
  const totalOverdueLast90 = await prisma.charge.aggregate({
    _sum: { originalAmount: true },
    where: { contract: { propertyId: { in: propertyIds } }, dueDate: { gte: subMonths(now, 3) }, status: "VENCIDA" },
  });
  const delinquencyRate =
    Number(totalBilledLast90._sum.originalAmount ?? 0) > 0
      ? (Number(totalOverdueLast90._sum.originalAmount ?? 0) / Number(totalBilledLast90._sum.originalAmount ?? 0)) * 100
      : 0;

  const contractsExpiringSoon = await prisma.contract.count({
    where: {
      deletedAt: null,
      propertyId: { in: propertyIds },
      status: { in: ["ATIVO", "EM_CARENCIA", "PROXIMO_VENCIMENTO"] },
      endDate: { gte: now, lte: addMonths(now, 6) },
    },
  });

  // Gráfico: distribuição das unidades por situação
  const unitsByStatus = await prisma.unit.groupBy({
    by: ["status"],
    where: { deletedAt: null, propertyId: { in: propertyIds } },
    _count: { _all: true },
  });

  // Gráfico: receita por empreendimento (contratos ativos)
  const revenueByPropertyRaw = await prisma.contract.groupBy({
    by: ["propertyId"],
    where: { deletedAt: null, propertyId: { in: propertyIds }, status: { in: ["ATIVO", "EM_CARENCIA", "PROXIMO_VENCIMENTO", "RENOVACAO"] } },
    _sum: { initialValue: true, condoFee: true, iptuFee: true, promoFundFee: true },
  });
  const revenueByProperty = revenueByPropertyRaw.map((r) => ({
    name: properties.find((p) => p.id === r.propertyId)?.name ?? "—",
    value: Number(r._sum.initialValue ?? 0) + Number(r._sum.condoFee ?? 0) + Number(r._sum.iptuFee ?? 0) + Number(r._sum.promoFundFee ?? 0),
  }));

  // Gráfico: receita prevista x recebida (últimos 6 meses)
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const refMonth = subMonths(now, i);
    const mStart = startOfMonth(refMonth);
    const mEnd = endOfMonth(refMonth);
    const [previstoAgg, recebidoAgg] = await Promise.all([
      prisma.charge.aggregate({
        _sum: { originalAmount: true },
        where: { contract: { propertyId: { in: propertyIds } }, competence: { gte: mStart, lte: mEnd }, status: { not: "CANCELADA" } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { isReversed: false, paidAt: { gte: mStart, lte: mEnd }, allocations: { some: { charge: { contract: { propertyId: { in: propertyIds } } } } } },
      }),
    ]);
    monthlyRevenue.push({
      month: format(refMonth, "MMM/yy", { locale: ptBR }),
      previsto: Number(previstoAgg._sum.originalAmount ?? 0),
      recebido: Number(recebidoAgg._sum.amount ?? 0),
    });
  }

  // Gráfico: inadimplência por mês (últimos 6 meses, vencidas por competência)
  const delinquencyByMonth = [];
  for (let i = 5; i >= 0; i--) {
    const refMonth = subMonths(now, i);
    const mStart = startOfMonth(refMonth);
    const mEnd = endOfMonth(refMonth);
    const agg = await prisma.charge.aggregate({
      _sum: { originalAmount: true, paidAmount: true },
      where: { contract: { propertyId: { in: propertyIds } }, competence: { gte: mStart, lte: mEnd }, status: "VENCIDA" },
    });
    delinquencyByMonth.push({
      month: format(refMonth, "MMM/yy", { locale: ptBR }),
      valor: Number(agg._sum.originalAmount ?? 0) - Number(agg._sum.paidAmount ?? 0),
    });
  }

  // Gráfico: contratos com vencimento nos próximos meses
  const expiringByMonth = [];
  for (let i = 0; i < 6; i++) {
    const refMonth = addMonths(now, i);
    const mStart = startOfMonth(refMonth);
    const mEnd = endOfMonth(refMonth);
    const count = await prisma.contract.count({
      where: { deletedAt: null, propertyId: { in: propertyIds }, status: { in: ["ATIVO", "EM_CARENCIA", "PROXIMO_VENCIMENTO"] }, endDate: { gte: mStart, lte: mEnd } },
    });
    expiringByMonth.push({ month: format(refMonth, "MMM/yy", { locale: ptBR }), quantidade: count });
  }

  // Gráfico: evolução da taxa de ocupação (aproximada por histórico de status)
  const occupancyTrend = [];
  const totalUnitsNow = occupancy.totalUnits;
  for (let i = 5; i >= 0; i--) {
    const refDate = endOfMonth(subMonths(now, i));
    const occupiedAtDate = await prisma.unitStatusHistory.groupBy({
      by: ["unitId"],
      where: { changedAt: { lte: refDate }, unit: { propertyId: { in: propertyIds } }, newStatus: { in: ["OCUPADA", "EM_CARENCIA"] } },
    });
    // Considera apenas unidades cujo último status até a data ainda é ocupado
    let occupiedCount = 0;
    for (const u of occupiedAtDate) {
      const lastChange = await prisma.unitStatusHistory.findFirst({
        where: { unitId: u.unitId, changedAt: { lte: refDate } },
        orderBy: { changedAt: "desc" },
      });
      if (lastChange && ["OCUPADA", "EM_CARENCIA"].includes(lastChange.newStatus)) occupiedCount++;
    }
    occupancyTrend.push({
      month: format(refDate, "MMM/yy", { locale: ptBR }),
      ocupacao: totalUnitsNow > 0 ? Math.round((occupiedCount / totalUnitsNow) * 1000) / 10 : 0,
    });
  }

  // Valor médio de locação por m² (unidades ocupadas)
  const activeUnits = await prisma.unit.findMany({
    where: { deletedAt: null, propertyId: { in: propertyIds }, status: { in: ["OCUPADA", "EM_CARENCIA"] } },
    select: { id: true, totalArea: true },
  });
  const contractByUnit = await prisma.contractUnit.findMany({
    where: { unitId: { in: activeUnits.map((u) => u.id) }, contract: { status: { in: ["ATIVO", "EM_CARENCIA", "PROXIMO_VENCIMENTO"] } } },
    include: { contract: { select: { initialValue: true } }, unit: { select: { totalArea: true } } },
  });
  const avgRentPerSqm =
    contractByUnit.length > 0
      ? contractByUnit.reduce((sum, cu) => sum + Number(cu.contract.initialValue) / Number(cu.unit.totalArea), 0) / contractByUnit.length
      : 0;

  return {
    properties,
    cards: {
      totalProperties: properties.length,
      totalLeasableArea: occupancy.totalArea,
      occupiedArea: occupancy.occupiedArea,
      availableArea: occupancy.availableArea,
      occupancyByArea: occupancy.occupancyByArea,
      occupancyByUnits: occupancy.occupancyByUnits,
      totalUnits: occupancy.totalUnits,
      occupiedUnits: occupancy.occupiedUnits,
      availableUnits: occupancy.availableUnits,
      reservedUnits: reservedCount,
      maintenanceUnits: maintenanceCount,
      monthlyContractedRevenue,
      receivedThisMonth: Number(receivedThisMonth._sum.amount ?? 0),
      overdueTotal,
      delinquencyRate,
      contractsExpiringSoon,
      negotiatingProposals,
      openTickets,
      avgRentPerSqm,
    },
    charts: {
      unitsByStatus: unitsByStatus.map((u) => ({ status: u.status, count: u._count._all })),
      revenueByProperty,
      monthlyRevenue,
      delinquencyByMonth,
      expiringByMonth,
      occupancyTrend,
    },
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
