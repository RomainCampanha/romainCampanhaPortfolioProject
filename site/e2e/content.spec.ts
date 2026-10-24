import { expect, test } from "@playwright/test";

// Contenu du profil affiché (round 2) : compétences LinkedIn, GE-Soif, voyages, LoL,
// et confidentialité (jamais de pseudo de jeu ni de lien vers un site de stats).

const PAGES = ["/", "/en", "/hobby", "/en/hobby", "/chat", "/en/chat"];

test("aucun pseudo de jeu, lien op.gg ni ancien contenu dans le HTML des pages", async ({ request, isMobile }) => {
  test.skip(isMobile, "HTML identique : projet desktop uniquement");
  for (const path of PAGES) {
    const res = await request.get(path, { headers: { "accept-language": "fr-CH" } });
    expect(res.status(), path).toBe(200);
    const html = await res.text();
    expect(html, path).not.toMatch(/beteu/i);
    expect(html, path).not.toMatch(/op\.gg/i);
    // Ancien domaine erroné, sons "faits maison", voix
    expect(html, path).not.toMatch(/(?<!-)gesoif\.ch/i);
    expect(html, path).not.toMatch(/mes sons de rap|sons que je fais|make tracks|my rap tracks|\(et je fais\)/i);
    expect(html, path).not.toMatch(/\bvoix\b|\bvoice\b/i);
  }
});

test("Pro : compétences groupées avec leur provenance", async ({ page }) => {
  await page.goto("/");
  const skills = page.locator("#competences");
  const chips = skills.locator("ul[aria-labelledby^='skills-'] > li");
  expect(await chips.count()).toBeGreaterThanOrEqual(25);

  const chip = (name: string) => chips.filter({ hasText: name });
  await expect(chip("Oracle Database")).toContainText("ESIG");
  await expect(chip("Gestion DNS")).toContainText("Infomaniak");
  await expect(chip("C#")).toContainText("CFPT");
  await expect(chip("Next.js")).toContainText("Autodidacte");
  await expect(chip("Droit du travail")).toBeVisible();
  await expect(skills.getByRole("heading", { name: "Gestion de projet" })).toBeVisible();
});

test("Pro : GE-Soif, projet d'école du CFPT, avec capture et lien", async ({ page }) => {
  await page.goto("/");
  const project = page.locator("#projets");
  await expect(project.getByRole("heading", { level: 3, name: "GE-Soif" })).toBeVisible();
  await expect(project).toContainText("Projet d'école");
  await expect(project).toContainText("Réalisé au CFPT pendant mon CFC");
  await expect(project).not.toContainText("Projet perso");

  const visit = project.getByRole("link", { name: /Visiter ge-soif\.ch/ });
  await expect(visit).toHaveAttribute("href", "https://ge-soif.ch");
  await expect(visit).toHaveAttribute("target", "_blank");

  const shot = project.getByRole("img", { name: /GE-Soif/ });
  await shot.scrollIntoViewIfNeeded();
  await expect.poll(() => shot.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  await page.goto("/en");
  await expect(page.locator("#projets").getByRole("link", { name: /Visit ge-soif\.ch/ })).toBeVisible();
});

test.describe("mouvement réduit", () => {
  // Rominou reste visible (colonne collante) et le WebGL logiciel de Chromium headless ralentit
  // chaque action : ce parcours d'albums tourne avec le poster (prefers-reduced-motion).
  test.use({ reducedMotion: "reduce" });

  test("Hobby : les 8 cartes d'embarquement et leurs albums", async ({ page }) => {
    await page.goto("/hobby");
    const cards = page.locator("#voyages > ul > li > article");
    await expect(cards).toHaveCount(8);
    for (const id of ["busan", "berlin", "tokyo", "shanghai", "paris", "brighton-dubrovnik", "toronto", "seoul"]) {
      await expect(page.locator(`article#${id}`)).toBeVisible();
    }
    await expect(page.locator("#voyages-title + p")).toContainText("de Séoul (2023) à Busan (2026)");
    // Nom coréen (Jua) à côté du nom latin
    await expect(page.locator("#seoul-title")).toContainText("서울");

    // Album (Shanghai, 14 photos) : replié derrière « Voir les 14 photos », puis toutes les photos
    const shanghai = page.locator("article#shanghai");
    const album = shanghai.getByRole("list", { name: "Photos de Shanghai" });
    await expect(album).toBeHidden();
    const toggle = shanghai.getByRole("button", { name: "Voir les 14 photos" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(album).toBeVisible();
    await expect(album.getByRole("listitem")).toHaveCount(14);
    await expect(shanghai.getByRole("button", { name: "Masquer les photos" })).toHaveAttribute("aria-expanded", "true");

    // Visionneuse : dialog modal, flèches, Échap rend le focus à la vignette
    await album.getByRole("button").nth(2).click();
    const viewer = page.getByRole("dialog", { name: "Photos de Shanghai" });
    await expect(viewer).toBeVisible();
    await expect(viewer).toContainText("Photo 3 sur 14");
    await page.keyboard.press("ArrowRight");
    await expect(viewer).toContainText("Photo 4 sur 14");
    await page.keyboard.press("Escape");
    await expect(viewer).toBeHidden();
    await expect(album.getByRole("button").nth(2)).toBeFocused();

    // Petit album (Berlin, 2 photos)
    const berlin = page.locator("article#berlin");
    await berlin.getByRole("button", { name: "Voir les 2 photos" }).click();
    await expect(berlin.getByRole("list", { name: "Photos de Berlin" }).getByRole("listitem")).toHaveCount(2);
  });
});

test("Hobby : /hobby#seoul (outil showTrip) ouvre l'album de Séoul", async ({ page }) => {
  await page.goto("/hobby#seoul");
  await expect(page.locator("article#seoul").getByRole("list", { name: "Photos de Séoul" })).toBeVisible();
  await expect(page.locator("article#busan").getByRole("list", { name: "Photos de Busan" })).toBeHidden();
});

test("Hobby : carte LoL, rap français et jeux (sans pseudo)", async ({ page }) => {
  await page.goto("/hobby");
  const lol = page.locator("#lol");
  await expect(lol).toContainText("Mid");
  await expect(lol).toContainText("Platine 4");
  for (const champion of ["Sett", "Azir", "LeBlanc", "Vel'Koz"]) {
    await expect(lol.getByRole("listitem").filter({ hasText: champion })).toBeVisible();
  }
  await expect(lol).toContainText("Pokopia");
  await expect(page.locator("#musique")).toContainText("Vald et Damso");
  await expect(page.locator("#jeu")).toContainText("Bientôt");

  await page.goto("/en/hobby");
  await expect(page.locator("#lol")).toContainText("Platinum 4");
});

test("Rominou, le guide : bulles et libellés", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("complementary", { name: "Rominou, le guide" })).toContainText("Rominou, le guide");
  await page.goto("/en/hobby");
  await expect(page.getByRole("complementary", { name: "Rominou, the guide" })).toContainText("Rominou, the guide");
});
