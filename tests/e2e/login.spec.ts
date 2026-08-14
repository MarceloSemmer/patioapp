import { test, expect } from "@playwright/test";

test.describe("Fluxo de login", () => {
  test("superadministrador entra e vê o dashboard com dados reais", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("superadmin@patiogestor.demo");
    await page.getByLabel("Senha").fill("Demo@123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Empreendimentos").first()).toBeVisible();
  });

  test("credenciais inválidas exibem mensagem de erro e não autenticam", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("superadmin@patiogestor.demo");
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("locatário é redirecionado para o portal e não acessa telas internas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("locatario@patiogestor.demo");
    await page.getByLabel("Senha").fill("Demo@123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/portal/);

    // Tenta acessar diretamente uma tela interna administrativa
    await page.goto("/usuarios");
    await expect(page).toHaveURL(/\/portal/);
  });

  test("acesso sem login redireciona para /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
