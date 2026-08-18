import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { resetDatabase, testPrisma } from "../helpers/db";
import { createCompanyFixture, createPropertyFixture, createUnitFixture, createTenantFixture, createUserFixture, fakeSession } from "../helpers/fixtures";

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
import { createContract } from "@/server/actions/contract-actions";

describe("prevenção de conflito de ocupação em contratos", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("impede criar um segundo contrato ativo para a mesma unidade em período conflitante", async () => {
    const company = await createCompanyFixture();
    const property = await createPropertyFixture(company.id);
    const unit = await createUnitFixture(property.id);
    const tenantA = await createTenantFixture(company.id, { name: "Locatário A" });
    const tenantB = await createTenantFixture(company.id, { name: "Locatário B", document: "22233344000199" });
    const admin = await createUserFixture("ADMIN", company.id);

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(admin, [company.id]));

    const first = await createContract({
      propertyId: property.id,
      tenantId: tenantA.id,
      proposalId: null,
      unitIds: [unit.id],
      type: "LOCACAO_PADRAO",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      initialValue: 1000,
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
    expect(first.status).toBe("MINUTA");

    // Ativa o primeiro contrato para que ele passe a "ocupar" a unidade
    await testPrisma.contract.update({ where: { id: first.id }, data: { status: "ATIVO" } });

    await expect(
      createContract({
        propertyId: property.id,
        tenantId: tenantB.id,
        proposalId: null,
        unitIds: [unit.id],
        type: "LOCACAO_PADRAO",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2027-06-01"),
        initialValue: 1200,
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
      }),
    ).rejects.toThrow(/já possuem contrato ativo/);
  });

  it("permite um segundo contrato para a mesma unidade em período NÃO conflitante", async () => {
    const company = await createCompanyFixture();
    const property = await createPropertyFixture(company.id);
    const unit = await createUnitFixture(property.id);
    const tenantA = await createTenantFixture(company.id, { name: "Locatário A" });
    const tenantB = await createTenantFixture(company.id, { name: "Locatário B", document: "22233344000199" });
    const admin = await createUserFixture("ADMIN", company.id);

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(admin, [company.id]));

    const first = await createContract({
      propertyId: property.id,
      tenantId: tenantA.id,
      proposalId: null,
      unitIds: [unit.id],
      type: "LOCACAO_PADRAO",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      initialValue: 1000,
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
    await testPrisma.contract.update({ where: { id: first.id }, data: { status: "ENCERRADO" } });

    const second = await createContract({
      propertyId: property.id,
      tenantId: tenantB.id,
      proposalId: null,
      unitIds: [unit.id],
      type: "LOCACAO_PADRAO",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      initialValue: 1200,
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

    expect(second.id).toBeDefined();
  });
});
