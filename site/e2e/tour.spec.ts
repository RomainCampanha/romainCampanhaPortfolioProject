import { expect, test, type Page } from "@playwright/test";

// « La visite de Rominou » : visite guidée en 10 étapes sur les trois pages (desktop + mobile).
// Les textes français portent des espaces fines insécables (« ! », « ? ») : on cible par regex.

// Modèles 3D bloqués (Rominou reste en poster) : en WebGL logiciel (CI, navigateur sans GPU),
// leur compilation prend plusieurs secondes par page et ralentit tous les tests en parallèle.
// Le premier test les garde : il vérifie que le Canvas persistant suit Rominou.
test.beforeEach(async ({ page }) => {
  await page.route("**/*.glb", (route) => route.abort());
});

const tourDialog = (page: Page, name?: RegExp) => page.getByRole("dialog", name ? { name } : undefined);

/** Lance la visite depuis l'invitation de la bulle du hero Pro. */
async function startFromHero(page: Page, path = "/") {
  await page.goto(path);
  const guide = page.getByRole("complementary", { name: /Rominou, (le|the) guide/ });
  await guide.getByRole("button", { name: /C.est parti|Let.s go/ }).click();
}

/** Avance au clavier jusqu'à l'étape `title` (la bulle a le focus à chaque étape). */
async function nextStep(page: Page, title: RegExp) {
  await page.keyboard.press("ArrowRight");
  await expect(tourDialog(page, title)).toBeVisible();
}

test("lancée depuis le hero : bulle sur l'île, puis compagnon, Suivant / Précédent", async ({ page }) => {
  test.setTimeout(60_000);
  await page.unroute("**/*.glb");
  await startFromHero(page);
  const hello = tourDialog(page, /Bienvenue chez moi/);
  await expect(hello).toBeVisible();
  await expect(hello).toBeFocused();
  await expect(hello).toContainText("1/10");
  await expect(hello).toContainText("Rominou, le mini-moi");
  // Première étape : dans la bulle du hero (Rominou reste sur son île), pas de compagnon
  await expect(page.locator("[data-tour-slot=hero]").getByRole("dialog")).toBeVisible();
  await expect(page.locator("[data-tour-companion]")).toHaveCount(0);

  await hello.getByRole("button", { name: /C.est parti/ }).click();
  const path = tourDialog(page, /Mon parcours/);
  await expect(path).toBeVisible();
  await expect(path).toContainText("2/10");
  // Faits injectés depuis profile.ts
  await expect(path).toContainText("CFC (CFPT)");
  await expect(path).toContainText("Professional Bachelor");
  await expect(path).toContainText("HES-SO (HEG)");
  // Compagnon + anneau autour de la section, section amenée à l'écran
  await expect(page.locator("[data-tour-companion]")).toBeVisible();
  // Le Canvas persistant (s'il a démarré : WebGL 2) suit Rominou dans le compagnon
  const stageStarted = (await page.locator("[data-avatar-stage]").count()) > 0;
  if (stageStarted) await expect(page.locator("[data-tour-companion] [data-avatar-stage]")).toHaveCount(1);
  await expect(page.locator("[data-tour-spotlight]")).toBeVisible();
  await expect(page.locator("#parcours")).toBeInViewport();
  // La bulle prend le focus et se lit avec sa description (le texte) : pas d'annonce en double
  await expect(path).toBeFocused();
  await expect(path).toHaveAccessibleDescription(/Sur mon mur/);
  await page.waitForTimeout(600);
  await expect(page.locator("[aria-live=polite]").filter({ hasText: "Étape 2 sur 10" })).toHaveCount(0);
  // Focus resté sur « Suivant » : la région live annonce l'étape suivante
  await path.getByRole("button", { name: "Suivant" }).click();
  await expect(tourDialog(page, /Mon job/)).toBeVisible();
  await expect(page.locator("[aria-live=polite]").filter({ hasText: "Étape 3 sur 10" })).toHaveCount(1);
  await tourDialog(page).getByRole("button", { name: "Précédent" }).click();
  await expect(path).toBeVisible();

  await path.getByRole("button", { name: "Précédent" }).click();
  await expect(tourDialog(page, /Bienvenue chez moi/)).toBeVisible();
  // …et revient sur son île quand la bulle retourne dans le hero
  await expect(page.locator("[data-tour-companion]")).toHaveCount(0);
  if (stageStarted) await expect(page.locator("[data-tour-anchor=hero] [data-avatar-stage]")).toHaveCount(1);
});

test("clavier : flèches, Échap, puis reprise depuis la carte « Visite du site »", async ({ page }) => {
  await startFromHero(page);
  await expect(tourDialog(page, /Bienvenue chez moi/)).toBeFocused();
  await nextStep(page, /Mon parcours/);
  await nextStep(page, /Mon job/);
  const job = tourDialog(page, /Mon job/);
  await expect(job).toContainText("Infomaniak");
  await expect(job).toContainText("70");
  await page.keyboard.press("ArrowLeft");
  await expect(tourDialog(page, /Mon parcours/)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(tourDialog(page)).toHaveCount(0);
  await expect(page.locator("[data-tour-companion]")).toHaveCount(0);
  // « Quitter » : pas de pastille flottante, la carte propose de reprendre
  await expect(page.locator("[data-tour-resume]")).toHaveCount(0);
  const resume = page.getByRole("button", { name: "Reprendre la visite guidée, étape 2 sur 10" });
  await resume.click();
  await expect(tourDialog(page, /Mon parcours/)).toBeVisible();
});

test("continue sur Hobby (même après rechargement) puis Chat, et se termine", async ({ page }) => {
  // Parcours long : 3 pages + rechargement
  test.setTimeout(60_000);
  await startFromHero(page);
  await expect(tourDialog(page, /Bienvenue chez moi/)).toBeFocused();
  for (const title of [/Mon parcours/, /Mon job/, /Mon inventaire/, /Mis en pratique/]) {
    await nextStep(page, title);
  }
  await expect(tourDialog(page)).toContainText("GE-Soif");
  await expect(tourDialog(page)).toContainText("projet d'école");
  await nextStep(page, /On s.écrit/);
  await tourDialog(page).getByRole("button", { name: "Mon côté perso" }).click();

  await expect(page).toHaveURL(/\/hobby$/);
  const travels = tourDialog(page, /Mes voyages/);
  await expect(travels).toBeVisible();
  await expect(travels).toContainText("7/10");
  await expect(travels).toContainText("8 cartes d'embarquement");
  await expect(travels).toContainText("Busan (2026)");
  await expect(page.locator("#voyages")).toBeInViewport();

  // Rechargement : la visite reprend à la même étape (sessionStorage)
  await page.reload();
  await expect(tourDialog(page, /Mes voyages/)).toBeVisible();
  await expect(tourDialog(page, /Mes voyages/)).toBeFocused();

  await nextStep(page, /Musique & jeux/);
  await expect(tourDialog(page)).toContainText("Vald et Damso");
  await nextStep(page, /La course de Rominou/);
  await expect(page.locator("#jeu")).toBeInViewport();
  await tourDialog(page).getByRole("button", { name: "Direction le chat" }).click();

  await expect(page).toHaveURL(/\/chat$/);
  const last = tourDialog(page, /À toi la parole/);
  await expect(last).toBeVisible();
  await expect(last).toContainText("10/10");
  await last.getByRole("button", { name: "Poser ma question" }).click();
  await expect(tourDialog(page)).toHaveCount(0);
  await expect(page.getByLabel("Ton message pour Rominou")).toBeFocused();
  await expect(page.getByRole("group", { name: /Visite terminée/ })).toBeAttached();
  await expect(page.getByRole("button", { name: "Refaire la visite" })).toBeAttached();
});

test("partir ailleurs met la visite en pause : pastille « Reprendre la visite »", async ({ page }) => {
  await startFromHero(page);
  await expect(tourDialog(page, /Bienvenue chez moi/)).toBeFocused();
  await nextStep(page, /Mon parcours/);
  await nextStep(page, /Mon job/);

  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Hobby" }).click();
  await expect(page).toHaveURL(/\/hobby$/);
  await expect(tourDialog(page)).toHaveCount(0);
  const chip = page.locator("[data-tour-resume]");
  await expect(chip).toBeVisible();
  await expect(chip).toContainText("Reprendre la visite (3/10)");

  await chip.getByRole("button", { name: "Reprendre la visite guidée, étape 3 sur 10" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(tourDialog(page, /Mon job/)).toBeVisible();
  await expect(chip).toHaveCount(0);
});

test("mouvement réduit : texte entier d'emblée, défilement immédiat", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startFromHero(page);
  await tourDialog(page, /Bienvenue chez moi/).getByRole("button", { name: /C.est parti/ }).click();
  const path = tourDialog(page, /Mon parcours/);
  await expect(path).toBeVisible();
  await expect(path.locator("[data-typing]")).toHaveCount(0);
  await expect(page.locator("#parcours")).toBeInViewport();
});

test("mobile : feuille au-dessus du dock, rien qui déborde", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mise en page mobile");
  for (const width of [412, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 640 : 915 });
    await startFromHero(page);
    await tourDialog(page, /Bienvenue chez moi/).getByRole("button", { name: /C.est parti/ }).click();
    const sheet = page.locator("[data-tour-companion]");
    await expect(tourDialog(page, /Mon parcours/)).toBeVisible();

    const dock = await page.locator(".page-nav").boundingBox();
    const box = await sheet.boundingBox();
    expect(dock && box, `${width}px`).toBeTruthy();
    if (!dock || !box) return;
    // Au-dessus du dock, dans l'écran
    expect(box.y + box.height, `${width}px`).toBeLessThanOrEqual(dock.y + 1);
    expect(box.y, `${width}px`).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, `${width}px`).toBeLessThanOrEqual(width);
    // Boutons atteignables (pas sous le dock)
    const next = await tourDialog(page).getByRole("button", { name: "Suivant" }).boundingBox();
    expect(next && next.y + next.height <= dock.y, `${width}px`).toBeTruthy();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${width}px`).toBeLessThanOrEqual(0);
    await page.evaluate(() => window.sessionStorage.clear());
  }
});

test("« Réduire » : pastille avec la tête de Rominou, puis la bulle revient", async ({ page }) => {
  await startFromHero(page);
  await tourDialog(page, /Bienvenue chez moi/).getByRole("button", { name: /C.est parti/ }).click();
  const path = tourDialog(page, /Mon parcours/);
  await expect(path).toBeVisible();
  // Carte « Visite du site » : seul le compteur de la visite guidée (pas de « 1/3 » en plus)
  await expect(page.getByText("Visite en cours · 2/10")).toBeAttached();
  await expect(page.locator("[data-avatar-anchor] p").filter({ hasText: /^1\/3$/ })).toHaveCount(0);

  await path.getByRole("button", { name: "Réduire la bulle" }).click();
  await expect(tourDialog(page)).toHaveCount(0);
  await expect(page.locator("[data-tour-companion]")).toHaveCount(0);
  const expand = page.getByRole("button", { name: "Afficher la bulle de la visite guidée, étape 2 sur 10" });
  await expect(expand).toBeFocused();
  await expect(page.locator("[data-tour-mini]")).toContainText("Afficher la bulle (2/10)");
  // L'anneau reste autour de la section commentée
  await expect(page.locator("[data-tour-spotlight]")).toBeVisible();

  await expand.click();
  await expect(path).toBeVisible();
  await expect(path).toBeFocused();
  await expect(path.locator("[data-typing]")).toHaveCount(0);
  await expect(page.locator("[data-tour-mini]")).toHaveCount(0);
});

test("« Je préfère lire » : pas de visite, Rominou répond", async ({ page }) => {
  await page.goto("/");
  const guide = page.getByRole("complementary", { name: "Rominou, le guide" });
  await guide.getByRole("button", { name: "Je préfère lire" }).click();
  await expect(guide).toContainText("bonne lecture");
  await expect(guide.getByRole("button", { name: /C.est parti/ })).toHaveCount(0);
  await expect(tourDialog(page)).toHaveCount(0);
});

test("en anglais (textes et faits traduits)", async ({ page }) => {
  await startFromHero(page, "/en");
  const hello = tourDialog(page, /Welcome to my place/);
  await expect(hello).toBeVisible();
  await expect(hello).toContainText("Step 1 of 10");
  await hello.getByRole("button", { name: /Let.s go/ }).click();
  const path = tourDialog(page, /My path/);
  await expect(path).toBeVisible();
  await expect(path).toContainText("Professional Bachelor");
  await expect(path).toContainText("HES-SO Bachelor (HEG)");
  await expect(path.getByRole("button", { name: "Previous" })).toBeVisible();
  await expect(path.getByRole("button", { name: "Quit the tour" })).toBeVisible();
});

test("chat : « fais-moi visiter » lance la visite (outil startTour)", async ({ page }) => {
  await page.goto("/chat");
  const input = page.getByLabel("Ton message pour Rominou");
  await input.fill("TOUR");
  await input.press("Enter");
  await expect(page.getByText("Rominou lance la visite du site")).toBeVisible();
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
  await expect(tourDialog(page, /Bienvenue chez moi/)).toBeVisible();
});
