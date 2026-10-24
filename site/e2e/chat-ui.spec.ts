import { expect, test } from "@playwright/test";

// Parcours du chat dans le navigateur, avec le faux OpenAI (e2e/mock-openai.mjs).

const INPUT = "Ton message pour Rominou";

test("Rominou garde le fil : sa réponse signée revient dans le contexte", async ({ page }) => {
  await page.goto("/chat");
  const input = page.getByLabel(INPUT);
  await input.fill("Bonjour");
  await input.press("Enter");
  await expect(page.getByText("Salut, moi c'est Rominou !", { exact: true })).toBeVisible();

  await input.fill("PROBE");
  await input.press("Enter");
  await expect(page.getByText("turns=1 forged=no", { exact: true })).toBeVisible();
});

test("un outil sans texte relance le modèle puis navigue (relance signée)", async ({ page }) => {
  await page.goto("/chat");
  const input = page.getByLabel(INPUT);
  await input.fill("TOOLONLY");
  await input.press("Enter");
  // La navigation n'a lieu qu'après la relance acceptée par le serveur
  await expect(page).toHaveURL(/\/hobby$/, { timeout: 15_000 });
  await expect(page.locator(".theme-root")).toHaveAttribute("data-theme", "hobby");
});

test("Arrêter garde le début de la réponse et l'indique", async ({ page }) => {
  await page.goto("/chat");
  const input = page.getByLabel(INPUT);
  await input.fill("SLOW");
  await input.press("Enter");
  const stop = page.getByRole("button", { name: "Arrêter" });
  await expect(stop).toBeVisible();
  await expect(page.locator("ol").getByText(/Bla Bla/)).toBeVisible();
  await stop.click();
  await expect(stop).toBeHidden();
  await expect(page.getByText("Réponse interrompue.")).toBeVisible();
  // Le début de la réponse reste affiché
  await expect(page.locator("ol").getByText(/Bla Bla/)).toBeVisible();
});
