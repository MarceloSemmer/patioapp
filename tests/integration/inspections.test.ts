import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { resetDatabase, testPrisma } from "../helpers/db";
import {
  createCompanyFixture,
  createPropertyFixture,
  createUnitFixture,
  createUserFixture,
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
import { createInspection, updateInspectionItem, completeInspection } from "@/server/actions/inspection-actions";

describe("vistorias / checklists", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("cria uma vistoria vinculada a uma unidade com os itens do checklist informados", async () => {
    const company = await createCompanyFixture();
    const property = await createPropertyFixture(company.id);
    const unit = await createUnitFixture(property.id);
    const admin = await createUserFixture("ADMIN", company.id);

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(admin, [company.id]));

    const inspection = await createInspection({
      contractId: null,
      unitId: unit.id,
      type: "PERIODICA",
      scheduledAt: null,
      responsibleName: "Síndico",
      notes: null,
      itemLabels: ["Item 1", "Item 2"],
    });

    const items = await testPrisma.inspectionItem.findMany({ where: { inspectionId: inspection.id }, orderBy: { order: "asc" } });
    expect(items).toHaveLength(2);
    expect(items[0].label).toBe("Item 1");
  });

  it("permite responder um item do checklist e concluir a vistoria", async () => {
    const company = await createCompanyFixture();
    const property = await createPropertyFixture(company.id);
    const unit = await createUnitFixture(property.id);
    const admin = await createUserFixture("ADMIN", company.id);

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(admin, [company.id]));

    const inspection = await createInspection({
      contractId: null,
      unitId: unit.id,
      type: "SAIDA",
      scheduledAt: null,
      responsibleName: null,
      notes: null,
      itemLabels: ["Pintura"],
    });
    const item = await testPrisma.inspectionItem.findFirstOrThrow({ where: { inspectionId: inspection.id } });

    await updateInspectionItem({ itemId: item.id, answer: "NAO_CONFORME", notes: "Precisa repintar a parede." });

    const updatedItem = await testPrisma.inspectionItem.findUniqueOrThrow({ where: { id: item.id } });
    expect(updatedItem.answer).toBe("NAO_CONFORME");

    const completed = await completeInspection({ inspectionId: inspection.id, signedByTenant: true, responsibleName: "Zelador", notes: null });
    expect(completed.performedAt).not.toBeNull();
    expect(completed.signedByTenant).toBe(true);
  });

  it("impede criar uma vistoria para uma unidade de outra empresa", async () => {
    const companyA = await createCompanyFixture("Empresa A");
    const companyB = await createCompanyFixture("Empresa B");
    const adminA = await createUserFixture("ADMIN", companyA.id);
    const propertyB = await createPropertyFixture(companyB.id);
    const unitB = await createUnitFixture(propertyB.id);

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(adminA, [companyA.id]));

    await expect(
      createInspection({
        contractId: null,
        unitId: unitB.id,
        type: "ENTRADA",
        scheduledAt: null,
        responsibleName: null,
        notes: null,
        itemLabels: ["Item 1"],
      }),
    ).rejects.toThrow(/não tem acesso/);
  });

  it("impede responder um item de uma vistoria de outra empresa", async () => {
    const companyA = await createCompanyFixture("Empresa A");
    const companyB = await createCompanyFixture("Empresa B");
    const adminA = await createUserFixture("ADMIN", companyA.id);
    const adminB = await createUserFixture("ADMIN", companyB.id);
    const propertyB = await createPropertyFixture(companyB.id);
    const unitB = await createUnitFixture(propertyB.id);

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(adminB, [companyB.id]));
    const inspection = await createInspection({
      contractId: null,
      unitId: unitB.id,
      type: "ENTRADA",
      scheduledAt: null,
      responsibleName: null,
      notes: null,
      itemLabels: ["Item 1"],
    });
    const item = await testPrisma.inspectionItem.findFirstOrThrow({ where: { inspectionId: inspection.id } });

    (requireSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(fakeSession(adminA, [companyA.id]));

    await expect(updateInspectionItem({ itemId: item.id, answer: "CONFORME" })).rejects.toThrow(/não tem acesso/);
  });
});
