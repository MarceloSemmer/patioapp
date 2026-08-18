import { test, expect } from "@playwright/test";

test.describe("Comparação de unidades lado a lado", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("admin@patiogestor.demo");
    await page.getByLabel("Senha").fill("Demo@123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("seleciona duas unidades e abre a comparação lado a lado", async ({ page }) => {
    await page.goto("/unidades");
    await expect(page.getByRole("heading", { name: "Unidades" })).toBeVisible();

    const checkboxes = page.getByRole("checkbox", { name: /Selecionar/ });
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    await expect(page.getByText("2 unidades selecionadas")).toBeVisible();
    await page.getByRole("button", { name: "Comparar" }).click();

    await expect(page).toHaveURL(/\/unidades\/comparar\?ids=/);
    await expect(page.getByRole("heading", { name: "Comparação de unidades" })).toBeVisible();
    await expect(page.getByText("Aluguel / m²")).toBeVisible();
  });
});
