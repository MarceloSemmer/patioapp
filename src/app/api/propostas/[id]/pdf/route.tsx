import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProposalDocument } from "@/lib/pdf/proposal-document";
import { recordAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const proposal = await prisma.proposal.findFirst({
    where: { id },
    include: {
      property: { select: { name: true, city: true, state: true, companyId: true } },
      tenant: { select: { name: true, document: true } },
      units: { include: { unit: { select: { code: true, totalArea: true } } } },
    },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
  }
  if (session.user.role !== "SUPERADMIN" && !session.user.companyIds.includes(proposal.property.companyId)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const buffer = await renderToBuffer(
    <ProposalDocument
      proposal={proposal}
      property={proposal.property}
      tenant={proposal.tenant}
      units={proposal.units.map((u) => u.unit)}
      emittedByName={session.user.name}
    />,
  );

  await recordAudit({
    companyId: proposal.property.companyId,
    userId: session.user.id,
    action: "DOWNLOAD_DOCUMENTO",
    entity: "Proposal",
    entityId: proposal.id,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="proposta-${proposal.number}.pdf"`,
    },
  });
}
