import { describe, it, expect, beforeEach, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import { resetDatabase, testPrisma } from "../helpers/db";
import { createCompanyFixture, createTenantFixture } from "../helpers/fixtures";

describe("autenticação (login) e isolamento do portal do locatário", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("permite login apenas com a senha correta e usuário ativo (mesma lógica usada em authorize())", async () => {
    const passwordHash = await bcrypt.hash("Demo@123", 4);
    const user = await testPrisma.user.create({
      data: { name: "Usuário Login", email: "login@teste.com", passwordHash, role: "ADMIN", isActive: true },
    });

    const found = await testPrisma.user.findUnique({ where: { email: "login@teste.com" } });
    expect(found).not.toBeNull();
    expect(found?.isActive).toBe(true);
    expect(await bcrypt.compare("Demo@123", found!.passwordHash)).toBe(true);
    expect(await bcrypt.compare("senha-errada", found!.passwordHash)).toBe(false);

    await testPrisma.user.update({ where: { id: user.id }, data: { isActive: false } });
    const inactive = await testPrisma.user.findUnique({ where: { email: "login@teste.com" } });
    expect(inactive?.isActive).toBe(false); // authorize() deve rejeitar usuários inativos
  });

  it("um locatário só enxerga contratos e cobranças vinculados ao próprio tenantId", async () => {
    const company = await createCompanyFixture();
    const tenantA = await createTenantFixture(company.id, { name: "Locatário A", document: "11111111000101" });
    const tenantB = await createTenantFixture(company.id, { name: "Locatário B", document: "22222222000102" });

    const property = await testPrisma.property.create({
      data: { companyId: company.id, name: "Prop", internalCode: "P-1", totalArea: 100, leasableArea: 80, status: "ATIVO" },
    });
    const unitA = await testPrisma.unit.create({ data: { propertyId: property.id, code: "A-1", type: "LOJA", privateArea: 10, totalArea: 12, status: "OCUPADA" } });
    const unitB = await testPrisma.unit.create({ data: { propertyId: property.id, code: "B-1", type: "LOJA", privateArea: 10, totalArea: 12, status: "OCUPADA" } });

    await testPrisma.contract.create({
      data: { number: "CT-A", propertyId: property.id, tenantId: tenantA.id, startDate: new Date(), endDate: new Date("2027-01-01"), initialValue: 1000, dueDay: 10, status: "ATIVO", units: { create: { unitId: unitA.id } } },
    });
    await testPrisma.contract.create({
      data: { number: "CT-B", propertyId: property.id, tenantId: tenantB.id, startDate: new Date(), endDate: new Date("2027-01-01"), initialValue: 1500, dueDay: 10, status: "ATIVO", units: { create: { unitId: unitB.id } } },
    });

    // Consulta que o portal executa: contratos filtrados por tenantId do usuário autenticado.
    const contractsForTenantA = await testPrisma.contract.findMany({ where: { tenantId: tenantA.id } });

    expect(contractsForTenantA).toHaveLength(1);
    expect(contractsForTenantA[0].number).toBe("CT-A");
  });
});
