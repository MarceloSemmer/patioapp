import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { resetDatabase, testPrisma } from "../helpers/db";
import {
  createCompanyFixture,
  createUserFixture,
  createPropertyFixture,
  createUnitFixture,
  createTenantFixture,
  fakeSession,
} from "../helpers/fixtures";

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
import { createProperty, updateProperty } from "@/server/actions/property-actions";
import { registerChargePayment } from "@/server/actions/charge-actions";
import { createTicket, updateTicketStatus } from "@/server/actions/ticket-actions";
import { uploadDocument } from "@/server/actions/document-actions";
import { createProposal } from "@/server/actions/proposal-actions";

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

  it("impede registrar pagamento em uma cobrança de contrato de outra empresa (financeiro)", async () => {
    const companyA = await createCompanyFixture("Empresa A");
    const companyB = await createCompanyFixture("Empresa B");
    const adminA = await createUserFixture("ADMIN", companyA.id);

    const propertyB = await createPropertyFixture(companyB.id);
    const unitB = await createUnitFixture(propertyB.id, { status: "OCUPADA" });
    const tenantB = await createTenantFixture(companyB.id);
    const contractB = await testPrisma.contract.create({
      data: {
        number: "CT-B-0001",
        propertyId: propertyB.id,
        tenantId: tenantB.id,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        initialValue: 1000,
        dueDay: 10,
        status: "ATIVO",
        units: { create: { unitId: unitB.id } },
      },
    });
    const chargeB = await testPrisma.charge.create({
      data: {
        contractId: contractB.id,
        competence: new Date("2026-01-01"),
        dueDate: new Date("2026-01-10"),
        originalAmount: 1000,
        status: "PENDENTE",
        items: { create: { type: "ALUGUEL", description: "Aluguel", amount: 1000 } },
      },
    });

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(adminA, [companyA.id]));

    await expect(
      registerChargePayment({ chargeId: chargeB.id, amount: 1000, method: "PIX", paidAt: new Date(), reference: null }),
    ).rejects.toThrow(/não tem acesso/);
  });

  it("impede alterar o status de um chamado de manutenção de outra empresa", async () => {
    const companyA = await createCompanyFixture("Empresa A");
    const companyB = await createCompanyFixture("Empresa B");
    const adminA = await createUserFixture("ADMIN", companyA.id);
    const adminB = await createUserFixture("ADMIN", companyB.id);

    const propertyB = await createPropertyFixture(companyB.id);
    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(adminB, [companyB.id]));
    const ticket = await createTicket({
      propertyId: propertyB.id,
      unitId: null,
      tenantId: null,
      category: "ELETRICA",
      priority: "MEDIA",
      title: "Lâmpada queimada",
      description: "Corredor principal sem iluminação.",
      vendorName: null,
      dueDate: null,
      estimatedCost: null,
    });

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(adminA, [companyA.id]));

    await expect(updateTicketStatus(ticket.id, "EM_ANALISE")).rejects.toThrow(/não tem acesso/);
  });

  it("impede o upload de um documento vinculado a uma empresa à qual o usuário não tem acesso", async () => {
    const companyA = await createCompanyFixture("Empresa A");
    const companyB = await createCompanyFixture("Empresa B");
    const adminA = await createUserFixture("ADMIN", companyA.id);

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(adminA, [companyA.id]));

    await expect(
      uploadDocument({
        companyId: companyB.id,
        propertyId: null,
        unitId: null,
        tenantId: null,
        contractId: null,
        type: "OUTROS",
        title: "Documento indevido",
        tags: [],
        fileUrl: "local:/uploads/documentos/teste.pdf",
        isPrivate: true,
        expiresAt: null,
      }),
    ).rejects.toThrow(/não tem acesso/);
  });

  it("impede criar uma proposta para um empreendimento de outra empresa", async () => {
    const companyA = await createCompanyFixture("Empresa A");
    const companyB = await createCompanyFixture("Empresa B");
    const adminA = await createUserFixture("ADMIN", companyA.id);

    const propertyB = await createPropertyFixture(companyB.id);
    const unitB = await createUnitFixture(propertyB.id);
    const tenantB = await createTenantFixture(companyB.id);

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(adminA, [companyA.id]));

    await expect(
      createProposal({
        propertyId: propertyB.id,
        tenantId: tenantB.id,
        leadId: null,
        unitIds: [unitB.id],
        totalArea: 50,
        rentValue: 2000,
        condoFee: null,
        iptuFee: null,
        promoFundFee: null,
        gracePeriodDays: 0,
        contractTermMonths: 36,
        adjustmentIndex: "IGPM",
        guaranteeType: "CAUCAO",
        guaranteeValue: null,
        validUntil: new Date("2026-12-31"),
        specialConditions: null,
      }),
    ).rejects.toThrow(/não tem acesso/);
  });
});
