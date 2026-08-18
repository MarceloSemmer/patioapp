import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { InspectionDocument } from "@/lib/pdf/inspection-document";
import { recordAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const inspection = await prisma.inspection.findFirst({
    where: { id },
    include: {
      contract: { include: { property: { select: { name: true, city: true, state: true, companyId: true } }, tenant: { select: { name: true, document: true } } } },
      unit: { include: { property: { select: { name: true, city: true, state: true, companyId: true } } } },
      items: { orderBy: { order: "asc" } },
    },
  });

  if (!inspection) {
    return NextResponse.json({ error: "Vistoria não encontrada." }, { status: 404 });
  }

  const property = inspection.contract?.property ?? inspection.unit?.property;
  if (!property) {
    return NextResponse.json({ error: "Vistoria sem empreendimento associado." }, { status: 500 });
  }
  if (session.user.role !== "SUPERADMIN" && !session.user.companyIds.includes(property.companyId)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const buffer = await renderToBuffer(
    <InspectionDocument
      inspection={inspection}
      property={property}
      unit={inspection.unit ? { code: inspection.unit.code } : null}
      tenant={inspection.contract?.tenant ?? null}
      items={inspection.items}
      emittedByName={session.user.name}
    />,
  );

  await recordAudit({
    companyId: property.companyId,
    userId: session.user.id,
    action: "DOWNLOAD_DOCUMENTO",
    entity: "Inspection",
    entityId: inspection.id,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="vistoria-${inspection.id}.pdf"`,
    },
  });
}
