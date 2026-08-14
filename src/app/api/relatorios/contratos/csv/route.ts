import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companyScope } from "@/lib/session";
import { toCsv } from "@/lib/csv";
import { contractStatusLabels } from "@/lib/labels";
import { format } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const companyIds = companyScope(session);
  const contracts = await prisma.contract.findMany({
    where: { deletedAt: null, property: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) } },
    include: { property: { select: { name: true } }, tenant: { select: { name: true } }, units: { include: { unit: { select: { code: true } } } } },
    orderBy: { startDate: "desc" },
  });

  const csv = toCsv(
    contracts.map((c) => ({
      Número: c.number,
      Empreendimento: c.property.name,
      Locatário: c.tenant.name,
      Unidades: c.units.map((u) => u.unit.code).join(", "),
      Início: format(c.startDate, "dd/MM/yyyy"),
      Fim: format(c.endDate, "dd/MM/yyyy"),
      "Valor inicial": Number(c.initialValue).toFixed(2),
      Status: contractStatusLabels[c.status],
    })),
  );

  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=contratos.csv" },
  });
}
