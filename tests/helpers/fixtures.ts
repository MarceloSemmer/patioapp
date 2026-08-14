import { testPrisma } from "./db";
import bcrypt from "bcryptjs";

export async function createCompanyFixture(name = "Empresa Teste Ltda.") {
  return testPrisma.company.create({ data: { name, isDemo: true } });
}

export async function createPropertyFixture(companyId: string, overrides: Partial<{ name: string; internalCode: string }> = {}) {
  return testPrisma.property.create({
    data: {
      companyId,
      name: overrides.name ?? "Empreendimento Teste",
      internalCode: overrides.internalCode ?? `TESTE-${Math.random().toString(36).slice(2, 8)}`,
      totalArea: 1000,
      leasableArea: 800,
      status: "ATIVO",
    },
  });
}

export async function createUnitFixture(propertyId: string, overrides: Partial<{ code: string; status: "DISPONIVEL" | "OCUPADA" | "RESERVADA" }> = {}) {
  return testPrisma.unit.create({
    data: {
      propertyId,
      code: overrides.code ?? `U-${Math.random().toString(36).slice(2, 8)}`,
      type: "LOJA",
      privateArea: 50,
      totalArea: 55,
      status: overrides.status ?? "DISPONIVEL",
    },
  });
}

export async function createTenantFixture(companyId: string, overrides: Partial<{ name: string; document: string }> = {}) {
  return testPrisma.tenant.create({
    data: {
      companyId,
      personType: "JURIDICA",
      name: overrides.name ?? "Locatário Teste Ltda.",
      document: overrides.document ?? String(Math.floor(Math.random() * 1e13)).padStart(14, "0"),
      status: "ATIVO",
    },
  });
}

export async function createUserFixture(role: "SUPERADMIN" | "ADMIN" | "GESTOR" | "FINANCEIRO" = "ADMIN", companyId?: string) {
  const passwordHash = await bcrypt.hash("Demo@123", 4);
  const user = await testPrisma.user.create({
    data: {
      name: "Usuário Teste",
      email: `user-${Math.random().toString(36).slice(2, 10)}@teste.com`,
      passwordHash,
      role,
      ...(companyId ? { companies: { create: { companyId } } } : {}),
    },
  });
  return user;
}

export function fakeSession(user: { id: string; name: string; email: string; role: string }, companyIds: string[] = [], propertyIds: string[] = []) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as never,
      companyIds,
      propertyIds,
      tenantId: null,
    },
    expires: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  };
}
