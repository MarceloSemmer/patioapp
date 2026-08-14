import { test, expect } from "@playwright/test";

test.describe("Navegação pelas principais telas (smoke test)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("superadmin@patiogestor.demo");
    await page.getByLabel("Senha").fill("Demo@123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  const routes = [
    { path: "/empreendimentos", heading: "Empreendimentos" },
    { path: "/unidades", heading: "Unidades" },
    { path: "/locatarios", heading: "Locatários" },
    { path: "/crm", heading: "CRM" },
    { path: "/propostas", heading: "Propostas comerciais" },
    { path: "/contratos", heading: "Contratos" },
    { path: "/financeiro", heading: "Financeiro" },
    { path: "/financeiro/inadimplencia", heading: "Régua de inadimplência" },
    { path: "/manutencao", heading: "Manutenção" },
    { path: "/documentos", heading: "Documentos" },
    { path: "/relatorios", heading: "Relatórios" },
    { path: "/notificacoes", heading: "Notificações" },
    { path: "/usuarios", heading: "Usuários" },
    { path: "/auditoria", heading: "Auditoria" },
    { path: "/proprietarios", heading: "Proprietários" },
    { path: "/configuracoes", heading: "Configurações" },
    { path: "/empresas", heading: "Empresas administradoras" },
  ];

  for (const route of routes) {
    test(`renderiza ${route.path} sem erro`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("pageerror", (err) => consoleErrors.push(err.message));

      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading, exact: false }).first()).toBeVisible();
      expect(consoleErrors).toEqual([]);
    });
  }

  test("abre um empreendimento, a planta interativa e uma unidade", async ({ page }) => {
    await page.goto("/empreendimentos");
    await page.getByText("Pátio Tijuco").first().click();
    await expect(page).toHaveURL(/\/empreendimentos\//);
    await expect(page.getByRole("heading", { name: "Pátio Tijuco" })).toBeVisible();

    await page.goto(page.url() + "/planta");
    await expect(page.getByRole("heading", { name: "Planta interativa" })).toBeVisible();

    await page.goto("/unidades");
    await page.getByRole("link", { name: /L-101/ }).first().click();
    await expect(page).toHaveURL(/\/unidades\//);
  });
});
