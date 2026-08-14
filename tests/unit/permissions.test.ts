import { describe, it, expect } from "vitest";
import { roleHasPermission, requirePermission } from "@/lib/permissions";

describe("permissões por perfil", () => {
  it("superadmin possui todas as permissões críticas", () => {
    expect(roleHasPermission("SUPERADMIN", "company:manage")).toBe(true);
    expect(roleHasPermission("SUPERADMIN", "finance:reverse")).toBe(true);
    expect(roleHasPermission("SUPERADMIN", "audit:view")).toBe(true);
  });

  it("financeiro não pode excluir empreendimentos nem gerenciar usuários", () => {
    expect(roleHasPermission("FINANCEIRO", "property:manage")).toBe(false);
    expect(roleHasPermission("FINANCEIRO", "user:manage")).toBe(false);
    expect(roleHasPermission("FINANCEIRO", "finance:manage")).toBe(true);
  });

  it("operacional não acessa valores financeiros sensíveis", () => {
    expect(roleHasPermission("OPERACIONAL", "finance:view")).toBe(false);
    expect(roleHasPermission("OPERACIONAL", "maintenance:manage")).toBe(true);
  });

  it("consulta tem apenas leitura (sem permissões de gestão)", () => {
    expect(roleHasPermission("CONSULTA", "unit:view")).toBe(true);
    expect(roleHasPermission("CONSULTA", "unit:manage")).toBe(false);
    expect(roleHasPermission("CONSULTA", "contract:manage")).toBe(false);
  });

  it("locatário não possui nenhuma permissão administrativa", () => {
    expect(roleHasPermission("LOCATARIO", "unit:view")).toBe(false);
    expect(roleHasPermission("LOCATARIO", "finance:view")).toBe(false);
  });

  it("requirePermission lança erro quando o perfil não possui a permissão", () => {
    expect(() => requirePermission("CONSULTA", "unit:manage")).toThrow();
    expect(() => requirePermission("ADMIN", "unit:manage")).not.toThrow();
  });
});
