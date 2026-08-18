import { test, expect } from "@playwright/test";

test.describe("Vistorias / checklists", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("admin@patiogestor.demo");
    await page.getByLabel("Senha").fill("Demo@123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("abre a vistoria de entrada do seed e responde um item do checklist", async ({ page }) => {
    await page.goto("/vistorias");
    await expect(page.getByRole("heading", { name: "Vistorias" })).toBeVisible();

    await page.getByRole("row", { name: /Café Aroma/ }).getByRole("link", { name: "Abrir" }).click();
    await expect(page).toHaveURL(/\/vistorias\//);
    await expect(page.getByText("Pisos sem trincas ou manchas")).toBeVisible();

    await page.getByRole("link", { name: "Baixar laudo em PDF" }).waitFor();
  });

  test("cria uma nova vistoria vinculada a uma unidade", async ({ page }) => {
    await page.goto("/vistorias");
    await page.getByRole("button", { name: "Nova vistoria" }).click();

    await page.getByRole("button", { name: "Vincular a unidade" }).click();
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option").first().click();

    await page.getByRole("button", { name: "Criar vistoria" }).click();
    await expect(page).toHaveURL(/\/vistorias\/[a-f0-9-]+$/);
    await expect(page.getByText("Instalações elétricas (tomadas, interruptores, quadro)")).toBeVisible();
  });
});
