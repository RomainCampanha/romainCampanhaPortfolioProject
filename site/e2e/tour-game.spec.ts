import { expect, test, type Page } from "@playwright/test";
import type { E2EGameState } from "@/lib/game/e2e";

// Visite guidée × « La course de Rominou » : la visite propose de jouer (étape 9, #jeu), s'efface
// pendant la partie (Canvas de Rominou suspendu) et revient à la fermeture du jeu sans voler le
// focus ; quitter Hobby en pleine partie nettoie ; l'écran de fin reste au-dessus du dock mobile.
// ?e2e=1 : niveau court ; &renderer=2d : rendu 2D (WebGL logiciel trop lent en test).

const E2E = "?e2e=1&renderer=2d";

test.beforeEach(async ({ page }) => {
  // Rominou en poster (cf. tour.spec.ts) : WebGL logiciel trop lent pour des tests en parallèle
  await page.route("**/*.glb", (route) => route.abort());
});

const state = (page: Page) =>
  page.evaluate(() => (window as Window & { __rominouGame?: { state: () => E2EGameState } }).__rominouGame?.state() ?? null);

async function waitForScreen(page: Page, screen: string, timeout = 30_000) {
  await expect.poll(async () => (await state(page))?.screen, { timeout }).toBe(screen);
}

/** Visite reprise directement à l'étape `step` (index), comme après un rechargement. */
async function tourAt(page: Page, step: number, path: string) {
  await page.goto(path);
  await page.evaluate((s) => sessionStorage.setItem("rominou:visite", JSON.stringify({ status: "active", step: s, declined: false })), step);
  await page.reload();
}

const tourStatus = (page: Page) =>
  page.evaluate(() => (JSON.parse(sessionStorage.getItem("rominou:visite") ?? "null") as { status: string } | null)?.status);

test("étape 9 : « Jouer une partie » lance le jeu, la visite s'efface puis revient", async ({ page, isMobile }) => {
  test.setTimeout(60_000);
  await tourAt(page, 8, `/hobby${E2E}`);
  const bubble = page.getByRole("dialog", { name: /La course de Rominou/ });
  await expect(bubble).toBeVisible();
  await expect(page.locator("#jeu")).toBeInViewport();

  await bubble.getByRole("button", { name: "Jouer une partie" }).click();
  await waitForScreen(page, "playing");
  // Pendant la partie : ni compagnon, ni anneau, ni bulle ; la visite reste en cours
  await expect(page.locator("[data-tour-companion]")).toHaveCount(0);
  await expect(page.locator("[data-tour-spotlight]")).toHaveCount(0);
  await expect(bubble).toHaveCount(0);
  expect(await tourStatus(page)).toBe("active");

  // Échap met le jeu en pause (sans quitter la visite)
  const game = page.locator("#jeu");
  if (isMobile) await game.getByRole("button", { name: "Pause" }).click();
  else await page.keyboard.press("Escape");
  await waitForScreen(page, "paused");
  expect(await tourStatus(page)).toBe("active");

  // Retour à la carte : la visite revient, le focus reste sur « Jouer » (pas volé par la bulle)
  await game.getByRole("button", { name: "Retour à la carte" }).click();
  await expect(bubble).toBeVisible();
  await expect(page.locator("[data-tour-companion]")).toBeVisible();
  await expect(game.getByRole("button", { name: "Jouer", exact: true })).toBeFocused();

  await bubble.getByRole("button", { name: "Direction le chat" }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole("dialog", { name: /À toi la parole/ })).toBeVisible();
});

test("étape 8 : l'anneau entoure la musique et LoL, pas le jeu", async ({ page }) => {
  await tourAt(page, 7, "/hobby");
  await expect(page.getByRole("dialog", { name: /Musique & jeux/ })).toBeVisible();
  const ring = page.locator("[data-tour-spotlight]");
  await expect(ring).toBeVisible();
  // Mesuré une fois la page stable (défilement doux, contenu qui se charge au-dessus)
  await expect
    .poll(async () => {
      const ringBox = await ring.boundingBox();
      const gameBox = await page.locator("#jeu").boundingBox();
      return !!ringBox && !!gameBox && ringBox.y + ringBox.height <= gameBox.y;
    })
    .toBe(true);
});

test("quitter Hobby en pleine partie : le jeu se démonte proprement", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`/hobby${E2E}#jeu`);
  await page.locator("#jeu").getByRole("button", { name: "Jouer", exact: true }).click();
  await waitForScreen(page, "playing");
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Chat" }).click();
  await expect(page).toHaveURL(/\/chat/);
  await expect(page.getByLabel("Ton message pour Rominou")).toBeVisible();
  expect(await state(page)).toBeNull();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  expect(errors.filter((e) => !/\.glb/.test(e))).toEqual([]);
});

test("mobile 320 px : écran de fin en entier, actions au-dessus du dock", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mise en page mobile");
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(`/hobby${E2E}#jeu`);
  const game = page.locator("#jeu");
  await game.getByRole("button", { name: "Jouer", exact: true }).click();
  await waitForScreen(page, "complete");
  const next = game.getByRole("button", { name: "Étape suivante : Séoul" });
  await expect(next).toBeFocused();
  await expect(next).toBeInViewport({ ratio: 1 });
  const dock = await page.locator(".page-nav").boundingBox();
  const box = await next.boundingBox();
  expect(dock && box && box.y + box.height <= dock.y).toBeTruthy();
  // Le reste de la carte est atteignable en faisant défiler la page (pas de boîte coupée)
  const back = game.getByRole("button", { name: "Retour à la carte" });
  await back.scrollIntoViewIfNeeded();
  await expect(back).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
