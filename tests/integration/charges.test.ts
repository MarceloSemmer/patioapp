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
import { generateChargesForContract, registerChargePayment, cancelCharge } from "@/server/actions/charge-actions";

async function setupContract(status: "ATIVO" = "ATIVO") {
  const company = await createCompanyFixture();
  const property = await createPropertyFixture(company.id);
  const unit = await createUnitFixture(property.id, { status: "OCUPADA" });
  const tenant = await createTenantFixture(company.id);
  const admin = await createUserFixture("FINANCEIRO", company.id);

  const contract = await testPrisma.contract.create({
    data: {
      number: "CT-TESTE-0001",
      propertyId: property.id,
      tenantId: tenant.id,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      initialValue: 1000,
      condoFee: 100,
      dueDay: 10,
      status,
      units: { create: { unitId: unit.id } },
    },
  });

  (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(admin, [company.id]));

  return { company, property, unit, tenant, admin, contract };
}

describe("geração de cobranças e baixas financeiras", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("gera cobranças mensais com valor = aluguel + condomínio, sem duplicar competências existentes", async () => {
    const { contract } = await setupContract();

    const result1 = await generateChargesForContract({ contractId: contract.id, months: 3 });
    expect(result1.count).toBe(3);

    const charges = await testPrisma.charge.findMany({ where: { contractId: contract.id } });
    expect(charges).toHaveLength(3);
    expect(Number(charges[0].originalAmount)).toBe(1100); // 1000 aluguel + 100 condomínio

    // Rodar novamente não deve duplicar as competências já geradas
    const result2 = await generateChargesForContract({ contractId: contract.id, months: 3 });
    expect(result2.count).toBe(0);

    const chargesAfter = await testPrisma.charge.findMany({ where: { contractId: contract.id } });
    expect(chargesAfter).toHaveLength(3);
  });

  it("realiza baixa total e marca a cobrança como PAGA", async () => {
    const { contract } = await setupContract();
    await generateChargesForContract({ contractId: contract.id, months: 1 });
    const charge = await testPrisma.charge.findFirstOrThrow({ where: { contractId: contract.id } });

    await registerChargePayment({ chargeId: charge.id, amount: 1100, method: "PIX", paidAt: new Date(), reference: null });

    const updated = await testPrisma.charge.findUniqueOrThrow({ where: { id: charge.id } });
    expect(updated.status).toBe("PAGA");
    expect(Number(updated.paidAmount)).toBe(1100);
  });

  it("realiza baixa parcial e mantém o saldo restante em aberto", async () => {
    const { contract } = await setupContract();
    await generateChargesForContract({ contractId: contract.id, months: 1 });
    const charge = await testPrisma.charge.findFirstOrThrow({ where: { contractId: contract.id } });

    await registerChargePayment({ chargeId: charge.id, amount: 400, method: "PIX", paidAt: new Date(), reference: null });

    const updated = await testPrisma.charge.findUniqueOrThrow({ where: { id: charge.id } });
    expect(updated.status).toBe("PARCIALMENTE_PAGA");
    expect(Number(updated.paidAmount)).toBe(400);

    // Baixa complementar até quitar
    await registerChargePayment({ chargeId: charge.id, amount: 700, method: "PIX", paidAt: new Date(), reference: null });
    const finalCharge = await testPrisma.charge.findUniqueOrThrow({ where: { id: charge.id } });
    expect(finalCharge.status).toBe("PAGA");
    expect(Number(finalCharge.paidAmount)).toBe(1100);
  });

  it("rejeita pagamento maior que o saldo em aberto", async () => {
    const { contract } = await setupContract();
    await generateChargesForContract({ contractId: contract.id, months: 1 });
    const charge = await testPrisma.charge.findFirstOrThrow({ where: { contractId: contract.id } });

    await expect(
      registerChargePayment({ chargeId: charge.id, amount: 9999, method: "PIX", paidAt: new Date(), reference: null }),
    ).rejects.toThrow(/excede o saldo/);
  });

  it("não permite cancelar cobrança que já possui pagamento registrado", async () => {
    const { contract } = await setupContract();
    await generateChargesForContract({ contractId: contract.id, months: 1 });
    const charge = await testPrisma.charge.findFirstOrThrow({ where: { contractId: contract.id } });
    await registerChargePayment({ chargeId: charge.id, amount: 500, method: "PIX", paidAt: new Date(), reference: null });

    await expect(cancelCharge(charge.id, "Motivo de teste")).rejects.toThrow(/já possui pagamentos/);
  });
});
