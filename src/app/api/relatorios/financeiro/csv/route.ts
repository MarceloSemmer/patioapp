import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companyScope } from "@/lib/session";
import { toCsv } from "@/lib/csv";
import { chargeStatusLabels } from "@/lib/labels";
import { format } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const companyIds = companyScope(session);
  const charges = await prisma.charge.findMany({
    where: { contract: { property: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) } } },
    include: { contract: { select: { number: true, tenant: { select: { name: true } }, property: { select: { name: true } } } } },
    orderBy: { dueDate: "desc" },
    take: 1000,
  });

  const csv = toCsv(
    charges.map((c) => ({
      Empreendimento: c.contract.property.name,
      Locatário: c.contract.tenant.name,
      Contrato: c.contract.number,
      Competência: format(c.competence, "MM/yyyy"),
      Vencimento: format(c.dueDate, "dd/MM/yyyy"),
      Valor: Number(c.originalAmount).toFixed(2),
      Pago: Number(c.paidAmount).toFixed(2),
      Status: chargeStatusLabels[c.status],
    })),
  );

  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=financeiro.csv" },
  });
}
