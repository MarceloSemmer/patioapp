import { test, expect, type Locator } from "@playwright/test";

async function dragCardToColumn(page: import("@playwright/test").Page, card: Locator, targetColumn: Locator) {
  const grip = card.getByLabel(/Arrastar para mover/);
  const gripBox = await grip.boundingBox();
  const targetBox = await targetColumn.boundingBox();
  if (!gripBox || !targetBox) throw new Error("Não foi possível localizar os elementos de arraste.");

  await page.mouse.move(gripBox.x + gripBox.width / 2, gripBox.y + gripBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 40, { steps: 10 });
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 60, { steps: 5 });
  await page.mouse.up();
}

test.describe("Drag-and-drop nos quadros Kanban", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("admin@patiogestor.demo");
    await page.getByLabel("Senha").fill("Demo@123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("arrasta um lead do CRM para a etapa seguinte e de volta", async ({ page }) => {
    await page.goto("/crm");
    await expect(page.getByRole("heading", { name: "CRM" })).toBeVisible();

    const sourceColumn = page.getByText("Novo contato", { exact: true }).locator("xpath=ancestor::div[contains(@class,'shrink-0')]");
    const targetColumn = page.getByText("Qualificação", { exact: true }).locator("xpath=ancestor::div[contains(@class,'shrink-0')]");

    const card = sourceColumn.locator(".rounded-lg.border").first();
    await expect(card).toBeVisible();
    const leadName = await card.locator("p.font-medium").first().innerText();

    await dragCardToColumn(page, card, targetColumn);

    await expect(async () => {
      await expect(targetColumn.getByText(leadName, { exact: true })).toBeVisible();
    }).toPass({ timeout: 5000 });
    await expect(sourceColumn.getByText(leadName, { exact: true })).toHaveCount(0);

    // Devolve o lead para a etapa original, deixando o estado de demonstração como estava.
    const movedCard = targetColumn.locator(".rounded-lg.border").filter({ hasText: leadName }).first();
    await dragCardToColumn(page, movedCard, sourceColumn);

    await expect(async () => {
      await expect(sourceColumn.getByText(leadName, { exact: true })).toBeVisible();
    }).toPass({ timeout: 5000 });
  });

  test("arrasta um chamado de manutenção para outra situação e de volta", async ({ page }) => {
    await page.goto("/manutencao");
    await expect(page.getByRole("heading", { name: "Manutenção" })).toBeVisible();

    const sourceColumn = page.getByText("Aberto", { exact: true }).locator("xpath=ancestor::div[contains(@class,'shrink-0')]");
    const targetColumn = page.getByText("Em análise", { exact: true }).locator("xpath=ancestor::div[contains(@class,'shrink-0')]");

    const card = sourceColumn.locator(".rounded-lg.border").first();
    await expect(card).toBeVisible();
    const protocol = await card.locator("p.text-xs.text-muted-foreground").first().innerText();

    await dragCardToColumn(page, card, targetColumn);

    await expect(async () => {
      await expect(targetColumn.getByText(protocol, { exact: true })).toBeVisible();
    }).toPass({ timeout: 5000 });

    const movedCard = targetColumn.locator(".rounded-lg.border").filter({ hasText: protocol }).first();
    await dragCardToColumn(page, movedCard, sourceColumn);

    await expect(async () => {
      await expect(sourceColumn.getByText(protocol, { exact: true })).toBeVisible();
    }).toPass({ timeout: 5000 });
  });
});
