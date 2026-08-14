import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ReceiptDocument } from "@/lib/pdf/receipt-document";
import { recordAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { paymentId } = await params;
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId },
    include: {
      allocations: {
        include: {
          charge: {
            include: {
              contract: {
                include: { tenant: true, property: true },
              },
            },
          },
        },
      },
    },
  });

  if (!payment || payment.allocations.length === 0) {
    return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
  }

  const contract = payment.allocations[0].charge.contract;
  if (session.user.role !== "SUPERADMIN" && !session.user.companyIds.includes(contract.property.companyId)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const buffer = await renderToBuffer(
    <ReceiptDocument
      payment={payment}
      tenant={contract.tenant}
      property={contract.property}
      contractNumber={contract.number}
      chargeCompetence={payment.allocations[0].charge.competence}
      emittedByName={session.user.name}
    />,
  );

  await recordAudit({
    companyId: contract.property.companyId,
    userId: session.user.id,
    action: "DOWNLOAD_DOCUMENTO",
    entity: "Payment",
    entityId: payment.id,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-${payment.id}.pdf"`,
    },
  });
}
