import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { companyScope } from "@/lib/session";
import { toCsv } from "@/lib/csv";
import { format } from "date-fns";
import { differenceInCalendarDays } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const companyIds = companyScope(session);
  const charges = await prisma.charge.findMany({
    where: { status: "VENCIDA", contract: { property: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) } } },
    include: { contract: { select: { number: true, tenant: { select: { name: true } }, property: { select: { name: true } } } } },
    orderBy: { dueDate: "asc" },
  });

  const csv = toCsv(
    charges.map((c) => ({
      Empreendimento: c.contract.property.name,
      Locatário: c.contract.tenant.name,
      Contrato: c.contract.number,
      Vencimento: format(c.dueDate, "dd/MM/yyyy"),
      "Dias em atraso": differenceInCalendarDays(new Date(), c.dueDate),
      "Valor em aberto": (Number(c.originalAmount) - Number(c.paidAmount)).toFixed(2),
    })),
  );

  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=inadimplencia.csv" },
  });
}
