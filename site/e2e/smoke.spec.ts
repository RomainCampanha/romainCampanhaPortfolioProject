import { expect, test } from "@playwright/test";

// Smoke tests du shell : pages, i18n, thème, navigation, 404.

const pages = [
  { path: "/", lang: "fr", theme: "pro", h1: "Romain Campanha" },
  { path: "/en", lang: "en", theme: "pro", h1: "Romain Campanha" },
  { path: "/hobby", lang: "fr", theme: "hobby", h1: "Mes hobbies" },
  { path: "/en/hobby", lang: "en", theme: "hobby", h1: "My hobbies" },
  { path: "/chat", lang: "fr", theme: "chat", h1: "Parle avec l'IA de Romain" },
  { path: "/en/chat", lang: "en", theme: "chat", h1: "Talk with Romain's AI" },
] as const;

for (const p of pages) {
  test(`${p.path} rend la page (${p.lang}, ${p.theme})`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    const res = await page.goto(p.path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
    await expect(page.locator(".theme-root")).toHaveAttribute("data-theme", p.theme);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.h1);
    await expect(page.locator("link[rel=alternate][hreflang=en]")).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test("navigation et changement de langue gardent le chemin", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  await nav.getByRole("link", { name: "Hobby" }).click();
  await expect(page).toHaveURL(/\/hobby$/);
  await expect(nav.getByRole("link", { name: "Hobby" })).toHaveAttribute("aria-current", "page");

  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/hobby$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.getByRole("link", { name: "Français" }).click();
  await expect(page).toHaveURL(/\/hobby$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

test("skip link visible au clavier", async ({ page, isMobile }) => {
  test.skip(isMobile, "clavier : desktop uniquement");
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Aller au contenu principal" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
});

test("404 localisée et globale", async ({ page }) => {
  const res = await page.goto("/en/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");

  const res2 = await page.goto("/missing-file.txt");
  expect(res2?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page introuvable");
});

test("404 sous /hobby : thème Pro, aucun lien de navigation actif", async ({ page }) => {
  const res = await page.goto("/hobby/nexiste-pas");
  expect(res?.status()).toBe(404);
  await expect(page.locator(".theme-root")).toHaveAttribute("data-theme", "pro");
  await expect(page.locator("[aria-current=page]")).toHaveCount(0);
});

test("pas de scroll horizontal", async ({ page }) => {
  for (const path of ["/", "/hobby", "/chat"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("en-têtes de sécurité", async ({ page }) => {
  const res = await page.goto("/");
  const headers = res?.headers() ?? {};
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});
