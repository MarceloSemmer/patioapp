import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { resetDatabase, testPrisma } from "../helpers/db";
import { createCompanyFixture, createPropertyFixture, createUnitFixture } from "../helpers/fixtures";
import { computeOccupancy } from "@/lib/metrics";

describe("cálculo da taxa de ocupação", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("calcula ocupação por unidades e por área considerando carência como ocupada", async () => {
    const company = await createCompanyFixture();
    const property = await createPropertyFixture(company.id);

    await createUnitFixture(property.id, { code: "U-1", status: "OCUPADA" });
    await createUnitFixture(property.id, { code: "U-2", status: "DISPONIVEL" });
    await createUnitFixture(property.id, { code: "U-3", status: "RESERVADA" });
    await testPrisma.unit.create({
      data: { propertyId: property.id, code: "U-4", type: "LOJA", privateArea: 50, totalArea: 55, status: "EM_CARENCIA" },
    });

    const occupancy = await computeOccupancy({ propertyId: property.id });

    expect(occupancy.totalUnits).toBe(4);
    // OCUPADA + EM_CARENCIA contam como ocupadas (regra de negócio: carência continua ocupando a unidade)
    expect(occupancy.occupiedUnits).toBe(2);
    expect(occupancy.availableUnits).toBe(1);
    expect(occupancy.reservedUnits).toBe(1);
    expect(occupancy.occupancyByUnits).toBeCloseTo(50, 5);
    expect(occupancy.totalArea).toBeCloseTo(4 * 55, 5);
    expect(occupancy.occupancyByArea).toBeCloseTo(50, 5);
  });

  it("retorna zero quando não há unidades cadastradas", async () => {
    const company = await createCompanyFixture();
    const property = await createPropertyFixture(company.id);
    const occupancy = await computeOccupancy({ propertyId: property.id });
    expect(occupancy.totalUnits).toBe(0);
    expect(occupancy.occupancyByUnits).toBe(0);
    expect(occupancy.occupancyByArea).toBe(0);
  });
});
