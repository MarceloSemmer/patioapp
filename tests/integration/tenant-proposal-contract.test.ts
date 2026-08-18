import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { resetDatabase, testPrisma } from "../helpers/db";
import { createCompanyFixture, createPropertyFixture, createUnitFixture, createUserFixture, fakeSession } from "../helpers/fixtures";

vi.mock("@/lib/session", () => ({
  requireSession: vi.fn(),
  companyScope: (session: { user: { role: string; companyIds: string[] } }) =>
    session.user.role === "SUPERADMIN" ? null : session.user.companyIds,
  propertyScope: (session: { user: { role: string; propertyIds: string[] } }) =>
    session.user.propertyIds.length > 0 ? session.user.propertyIds : null,
  assertCompanyAccess: (session: { user: { role: string; companyIds: string[] } }, companyId: string) => {
    if (session.user.role === "SUPERADMIN") return;
    if (!session.user.companyIds.includes(companyId)) {
      throw new Error("Você não tem acesso a esta empresa.");
    }
  },
  assertPropertyAccess: (session: { user: { role: string; propertyIds: string[] } }, propertyId: string) => {
    if (session.user.role === "SUPERADMIN") return;
    if (session.user.propertyIds.length > 0 && !session.user.propertyIds.includes(propertyId)) {
      throw new Error("Você não tem acesso a este empreendimento.");
    }
  },
}));

import { requireSession } from "@/lib/session";
import { createTenant } from "@/server/actions/tenant-actions";
import { createProposal, updateProposalStatus } from "@/server/actions/proposal-actions";
import { createContract } from "@/server/actions/contract-actions";

describe("cadastro de locatário, proposta e conversão em contrato", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("cadastra um locatário e rejeita CPF/CNPJ duplicado na mesma empresa", async () => {
    const company = await createCompanyFixture();
    const admin = await createUserFixture("ADMIN", company.id);
    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(admin, [company.id]));

    const tenant = await createTenant({
      companyId: company.id,
      personType: "JURIDICA",
      name: "Comércio Teste Ltda.",
      tradeName: null,
      document: "11.222.333/0001-81",
      stateRegistration: null,
      segment: null,
      brand: null,
      legalResponsible: null,
      phone: null,
      whatsapp: null,
      email: null,
      website: null,
      zipCode: null,
      street: null,
      number: null,
      complement: null,
      neighborhood: null,
      city: null,
      state: null,
      billingNotes: null,
      notes: null,
      status: "ATIVO",
    });
    expect(tenant.id).toBeDefined();

    await expect(
      createTenant({
        companyId: company.id,
        personType: "JURIDICA",
        name: "Outra Empresa Ltda.",
        tradeName: null,
        document: "11.222.333/0001-81",
        stateRegistration: null,
        segment: null,
        brand: null,
        legalResponsible: null,
        phone: null,
        whatsapp: null,
        email: null,
        website: null,
        zipCode: null,
        street: null,
        number: null,
        complement: null,
        neighborhood: null,
        city: null,
        state: null,
        billingNotes: null,
        notes: null,
        status: "ATIVO",
      }),
    ).rejects.toThrow(/já existe um locatário/i);
  });

  it("converte uma proposta aprovada em contrato e atualiza o status da proposta", async () => {
    const company = await createCompanyFixture();
    const property = await createPropertyFixture(company.id);
    const unit = await createUnitFixture(property.id, { status: "DISPONIVEL" });
    const admin = await createUserFixture("ADMIN", company.id);
    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(admin, [company.id]));

    const tenant = await createTenant({
      companyId: company.id,
      personType: "JURIDICA",
      name: "Locatário Proposta Ltda.",
      tradeName: null,
      document: "22.333.444/0001-81",
      stateRegistration: null,
      segment: null,
      brand: null,
      legalResponsible: null,
      phone: null,
      whatsapp: null,
      email: null,
      website: null,
      zipCode: null,
      street: null,
      number: null,
      complement: null,
      neighborhood: null,
      city: null,
      state: null,
      billingNotes: null,
      notes: null,
      status: "ATIVO",
    });

    const proposal = await createProposal({
      propertyId: property.id,
      tenantId: tenant.id,
      leadId: null,
      unitIds: [unit.id],
      totalArea: 55,
      rentValue: 2000,
      condoFee: null,
      iptuFee: null,
      promoFundFee: null,
      gracePeriodDays: 0,
      contractTermMonths: 24,
      adjustmentIndex: "IGPM",
      guaranteeType: "CAUCAO",
      guaranteeValue: null,
      validUntil: new Date("2026-12-31"),
      specialConditions: null,
    });
    expect(proposal.status).toBe("RASCUNHO");

    await updateProposalStatus(proposal.id, "APROVADA");

    const contract = await createContract({
      propertyId: property.id,
      tenantId: tenant.id,
      proposalId: proposal.id,
      unitIds: [unit.id],
      type: "LOCACAO_PADRAO",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2028-02-01"),
      initialValue: 2000,
      dueDay: 10,
      gracePeriodDays: 0,
      adjustmentIndex: "IGPM",
      adjustmentPeriodMonths: 12,
      condoFee: null,
      iptuFee: null,
      promoFundFee: null,
      otherFees: null,
      guaranteeType: "CAUCAO",
      guaranteeValue: null,
      guarantorName: null,
      noticePeriodDays: 30,
      commercialResponsible: null,
      notes: null,
    });

    expect(contract.proposalId).toBe(proposal.id);

    const updatedProposal = await testPrisma.proposal.findUniqueOrThrow({ where: { id: proposal.id } });
    expect(updatedProposal.status).toBe("CONVERTIDA");
  });
});
