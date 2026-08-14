import { requireSession, companyScope } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { requirePermission } from "@/lib/permissions";
import { ContractForm } from "./contract-form";

export default async function NewContractPage({ searchParams }: { searchParams: Promise<{ propostaId?: string }> }) {
  const session = await requireSession();
  requirePermission(session.user.role, "contract:manage");
  const params = await searchParams;
  const companyIds = companyScope(session);

  const properties = await prisma.property.findMany({
    where: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
    select: {
      id: true,
      name: true,
      units: { where: { deletedAt: null }, select: { id: true, code: true, totalArea: true, status: true, suggestedRent: true, condoFee: true, iptuFee: true } },
    },
    orderBy: { name: "asc" },
  });

  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null, ...(companyIds ? { companyId: { in: companyIds } } : {}) },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  let prefill = null;
  if (params.propostaId) {
    const proposal = await prisma.proposal.findFirst({
      where: { id: params.propostaId },
      include: { units: { select: { unitId: true } } },
    });
    if (proposal) {
      prefill = {
        proposalId: proposal.id,
        propertyId: proposal.propertyId,
        tenantId: proposal.tenantId,
        unitIds: proposal.units.map((u) => u.unitId),
        initialValue: Number(proposal.rentValue),
        condoFee: proposal.condoFee ? Number(proposal.condoFee) : undefined,
        iptuFee: proposal.iptuFee ? Number(proposal.iptuFee) : undefined,
        promoFundFee: proposal.promoFundFee ? Number(proposal.promoFundFee) : undefined,
        gracePeriodDays: proposal.gracePeriodDays ?? 0,
        contractTermMonths: proposal.contractTermMonths,
        adjustmentIndex: proposal.adjustmentIndex,
        guaranteeType: proposal.guaranteeType,
        guaranteeValue: proposal.guaranteeValue ? Number(proposal.guaranteeValue) : undefined,
      };
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Contratos", href: "/contratos" }, { label: "Novo" }]} />
      <PageHeader title="Novo contrato" description="Somente unidades sem conflito de vigência podem ser vinculadas." />
      <ContractForm properties={properties} tenants={tenants} prefill={prefill} />
    </div>
  );
}
