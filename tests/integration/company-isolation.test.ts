import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { resetDatabase, testPrisma } from "../helpers/db";
import { createCompanyFixture, createUserFixture, fakeSession } from "../helpers/fixtures";

vi.mock("@/lib/session", () => ({
  requireSession: vi.fn(),
  companyScope: (session: { user: { role: string; companyIds: string[] } }) =>
    session.user.role === "SUPERADMIN" ? null : session.user.companyIds,
  propertyScope: (session: { user: { role: string; propertyIds: string[] } }) =>
    session.user.propertyIds.length > 0 ? session.user.propertyIds : null,
}));

import { requireSession } from "@/lib/session";
import { createProperty, updateProperty } from "@/server/actions/property-actions";

describe("isolamento de dados por empresa", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("impede um administrador de criar um empreendimento em uma empresa à qual não tem acesso", async () => {
    const companyA = await createCompanyFixture("Empresa A");
    const companyB = await createCompanyFixture("Empresa B");
    const adminA = await createUserFixture("ADMIN", companyA.id);

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(adminA, [companyA.id]));

    await expect(
      createProperty({
        companyId: companyB.id,
        name: "Empreendimento indevido",
        internalCode: "X-001",
        cnpj: null,
        municipalRegistry: null,
        phone: null,
        email: null,
        whatsapp: null,
        zipCode: null,
        street: null,
        number: null,
        complement: null,
        neighborhood: null,
        city: null,
        state: null,
        totalArea: 100,
        builtArea: null,
        leasableArea: 80,
        parkingSpaces: null,
        openingHours: null,
        responsibleName: null,
        description: null,
        amenities: [],
        internalRules: null,
        status: "ATIVO",
        notes: null,
      }),
    ).rejects.toThrow(/não tem acesso/);
  });

  it("impede editar um empreendimento de outra empresa mesmo com o ID correto", async () => {
    const companyA = await createCompanyFixture("Empresa A");
    const companyB = await createCompanyFixture("Empresa B");
    const adminA = await createUserFixture("ADMIN", companyA.id);

    const propertyB = await testPrisma.property.create({
      data: { companyId: companyB.id, name: "Empreendimento B", internalCode: "B-001", totalArea: 100, leasableArea: 80, status: "ATIVO" },
    });

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(adminA, [companyA.id]));

    await expect(
      updateProperty(propertyB.id, {
        companyId: companyB.id,
        name: "Tentativa de alteração indevida",
        internalCode: "B-001",
        cnpj: null,
        municipalRegistry: null,
        phone: null,
        email: null,
        whatsapp: null,
        zipCode: null,
        street: null,
        number: null,
        complement: null,
        neighborhood: null,
        city: null,
        state: null,
        totalArea: 100,
        builtArea: null,
        leasableArea: 80,
        parkingSpaces: null,
        openingHours: null,
        responsibleName: null,
        description: null,
        amenities: [],
        internalRules: null,
        status: "ATIVO",
        notes: null,
      }),
    ).rejects.toThrow(/não tem acesso/);
  });

  it("consulta de unidades filtrada por empresa não retorna dados de outra empresa", async () => {
    const companyA = await createCompanyFixture("Empresa A");
    const companyB = await createCompanyFixture("Empresa B");
    const propertyA = await testPrisma.property.create({
      data: { companyId: companyA.id, name: "Prop A", internalCode: "A-1", totalArea: 100, leasableArea: 80, status: "ATIVO" },
    });
    const propertyB = await testPrisma.property.create({
      data: { companyId: companyB.id, name: "Prop B", internalCode: "B-1", totalArea: 100, leasableArea: 80, status: "ATIVO" },
    });
    await testPrisma.unit.create({ data: { propertyId: propertyA.id, code: "A-U1", type: "LOJA", privateArea: 10, totalArea: 12, status: "DISPONIVEL" } });
    await testPrisma.unit.create({ data: { propertyId: propertyB.id, code: "B-U1", type: "LOJA", privateArea: 10, totalArea: 12, status: "DISPONIVEL" } });

    const unitsForCompanyA = await testPrisma.unit.findMany({ where: { property: { companyId: companyA.id } } });

    expect(unitsForCompanyA).toHaveLength(1);
    expect(unitsForCompanyA[0].code).toBe("A-U1");
  });
});
