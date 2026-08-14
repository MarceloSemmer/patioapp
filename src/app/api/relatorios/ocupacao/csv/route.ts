import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companyScope } from "@/lib/session";
import { toCsv } from "@/lib/csv";
import { unitStatusLabels, unitTypeLabels } from "@/lib/labels";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const companyIds = companyScope(session);
  const units = await prisma.unit.findMany({
    where: { deletedAt: null, property: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) } },
    include: { property: { select: { name: true } }, sector: { select: { name: true } } },
    orderBy: [{ property: { name: "asc" } }, { code: "asc" }],
  });

  const csv = toCsv(
    units.map((u) => ({
      Empreendimento: u.property.name,
      Setor: u.sector?.name ?? "",
      Unidade: u.code,
      Tipo: unitTypeLabels[u.type],
      "Área total (m²)": Number(u.totalArea).toFixed(2),
      Situação: unitStatusLabels[u.status],
    })),
  );

  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=mapa-ocupacao.csv" },
  });
}
