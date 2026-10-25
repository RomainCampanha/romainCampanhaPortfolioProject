import { expect, test, type Page } from "@playwright/test";
import { levelCards, levelDefs } from "@/lib/game/catalog";
import { generateLevel } from "@/lib/game/generate";
import { DT } from "@/lib/game/physics";
import { validateLevel } from "@/lib/game/validate";
import type { GameMode, LevelId } from "@/lib/game/types";
import type { E2EGameState } from "@/lib/game/e2e";

// « La course de Rominou » (#jeu, page Hobby).
// - Validateur : chaque niveau (tous modes, + niveaux courts e2e) est faisable sans perdre un cœur.
// - Parcours : ouvrir le jeu, sauter, finir l'étape courte (?e2e=1), voir la carte postale,
//   la retrouver dans la collection après rechargement ; parcours 100 % clavier ; anglais.
// ?e2e=1 : niveaux raccourcis (~7 s) + état exposé sur window.__rominouGame (cf. lib/game/e2e.ts).
// &renderer=2d : rendu 2D de secours pour les parties jouées (le WebGL logiciel du navigateur de
// test est trop lent pour le temps réel) ; le rendu 3D a son propre test de chargement.
const E2E = "?e2e=1&renderer=2d";

const state = (page: Page) =>
  page.evaluate(() => (window as Window & { __rominouGame?: { state: () => E2EGameState } }).__rominouGame?.state() ?? null);

async function waitForScreen(page: Page, screen: string, timeout = 30_000) {
  await expect.poll(async () => (await state(page))?.screen, { timeout }).toBe(screen);
}

test.describe("validateur de niveaux", () => {
  test.skip(({ isMobile }) => isMobile, "logique pure : une seule fois");

  test("tous les niveaux sont faisables (normal, tranquille, courts)", () => {
    const defs = levelDefs();
    // Genève, puis les voyages du plus ancien au plus récent (profile.travels est inversé).
    expect(defs.map((d) => d.id)).toEqual([
      "geneve",
      "seoul",
      "toronto",
      "brighton-dubrovnik",
      "paris",
      "shanghai",
      "tokyo",
      "berlin",
      "busan",
    ]);
    for (const mode of ["normal", "tranquille"] as const) {
      for (const short of [false, true]) {
        let previousSpeed = 0;
        for (const def of defs) {
          const level = generateLevel(def, { mode, short });
          const report = validateLevel(level);
          expect(report.issues, `${def.id} (${mode}${short ? ", court" : ""})`).toEqual([]);
          expect(report.tightest).toBeGreaterThanOrEqual(level.minSlack);
          if (!short) {
            expect(report.duration).toBeGreaterThanOrEqual(40);
            expect(report.duration).toBeLessThanOrEqual(60);
            // Difficulté croissante : la vitesse monte d'une étape à l'autre.
            expect(level.speed).toBeGreaterThan(previousSpeed);
            previousSpeed = level.speed;
          }
          // Déterministe : même id, même mode -> même niveau.
          expect(generateLevel(def, { mode, short })).toEqual(level);
        }
      }
    }
  });

  test("robustesse : graines aléatoires et rangs au-delà des voyages actuels", () => {
    for (let n = 0; n < 12; n++) {
      for (let index = 0; index <= 10; index++) {
        for (const mode of ["normal", "tranquille"] as const) {
          const level = generateLevel({ id: `fuzz-${n}` as never, index }, { mode });
          expect(validateLevel(level).issues, `fuzz-${n} rang ${index} ${mode}`).toEqual([]);
        }
      }
    }
  });
});

test.describe("jeu", () => {
  // Navigateurs de test : WebGL logiciel (Rominou du site) -> pages lentes, marge large.
  test.describe.configure({ timeout: 90_000 });
  test("partie complète : saut, carte postale, collection après rechargement", async ({ page, isMobile }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const scripts: string[] = [];
    page.on("request", (r) => {
      if (r.resourceType() === "script") scripts.push(r.url());
    });

    await page.goto(`/hobby${E2E}#jeu`);
    const game = page.locator("#jeu");
    await expect(game.getByRole("heading", { name: "La course de Rominou" })).toBeVisible();
    const collection = game.getByRole("region", { name: "Mes cartes postales" });
    await expect(collection).toContainText("0 sur 9 débloquées");
    await expect(collection.getByRole("img", { name: "Carte postale de Genève : à débloquer" })).toBeVisible();
    // Carte du voyage : Genève jouable, Séoul verrouillée.
    const map = game.getByRole("region", { name: "Carte du voyage" });
    await expect(map.getByRole("button", { name: /Genève/ })).toHaveAttribute("aria-pressed", "true");
    await expect(map.getByRole("button", { name: /Séoul/ })).toHaveAttribute("aria-disabled", "true");

    // Le moteur n'est pas encore là : il arrive au clic sur « Jouer » (chunk à part).
    expect(await state(page)).toBeNull();
    await page.waitForLoadState("networkidle");
    const before = scripts.length;
    await game.getByRole("button", { name: "Jouer", exact: true }).click();
    await waitForScreen(page, "playing");
    expect(scripts.length, "chunk du jeu chargé à la demande").toBeGreaterThan(before);
    expect((await state(page))?.levelId).toBe("geneve");

    // Saut : Espace (desktop) ou tape sur l'écran (mobile).
    const playArea = game.getByRole("application");
    if (isMobile) await playArea.tap();
    else await page.keyboard.press("Space");
    await expect.poll(async () => (await state(page))?.y ?? 0, { timeout: 2_000 }).toBeGreaterThan(0.2);

    // Étape courte (~7 s) : arrivée à la porte, carte postale dévoilée.
    await waitForScreen(page, "complete");
    const done = game.getByRole("dialog", { name: "Carte postale débloquée : Genève" });
    await expect(done).toBeVisible();
    await expect(done.getByRole("img", { name: /Illustration de Genève/ })).toBeVisible();
    await expect(done).toContainText("Point de départ");
    await expect(done.getByRole("button", { name: "Étape suivante : Séoul" })).toBeVisible();

    // Rechargement : la carte est dans la collection, Séoul est débloquée.
    await page.reload();
    await expect(collection).toContainText("1 sur 9 débloquées");
    const open = collection.getByRole("button", { name: "Voir la carte postale de Genève" });
    await open.click();
    const dialog = page.getByRole("dialog", { name: "Voir la carte postale de Genève" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Bons baisers de");
    await dialog.getByRole("button", { name: "Fermer" }).click();
    await expect(dialog).toBeHidden();
    await expect(map.getByRole("button", { name: /Séoul/ })).not.toHaveAttribute("aria-disabled", "true");
    expect(errors).toEqual([]);
  });

  test("100 % clavier : jouer, pause, reprendre, finir, retour à la carte", async ({ page, isMobile }) => {
    test.skip(isMobile, "clavier : desktop uniquement");
    await page.goto(`/hobby${E2E}#jeu`);
    const game = page.locator("#jeu");
    const play = game.getByRole("button", { name: "Jouer", exact: true });
    // Atteindre « Jouer » au clavier depuis le titre de la section.
    await game.getByRole("switch", { name: "Mode tranquille" }).focus();
    await page.keyboard.press("Shift+Tab");
    await expect(play).toBeFocused();
    await page.keyboard.press("Enter");
    await waitForScreen(page, "playing");
    await expect(game.getByRole("application")).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect.poll(async () => (await state(page))?.y ?? 0, { timeout: 2_000 }).toBeGreaterThan(0.2);

    await page.keyboard.press("Escape");
    await waitForScreen(page, "paused");
    const resume = game.getByRole("button", { name: "Reprendre" });
    await expect(resume).toBeFocused();
    // Reprise : « Prêt ? Partez ! » d'abord (la course ne repart pas d'un coup)
    const pausedAt = (await state(page))?.t ?? 0;
    await page.keyboard.press("Enter");
    expect((await state(page))?.screen).toBe("countdown");
    await expect(game.getByText(/Prêt/)).toBeVisible();
    expect((await state(page))?.t).toBe(pausedAt);
    await waitForScreen(page, "playing");

    await waitForScreen(page, "complete");
    await expect(game.getByRole("button", { name: "Étape suivante : Séoul" })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(game.getByRole("button", { name: "Retour à la carte" })).toBeFocused();
    await page.keyboard.press("Enter");
    // Retour à l'écran titre : focus sur « Jouer », prochain départ = Séoul.
    await expect(play).toBeFocused();
    await expect(game).toContainText("Séoul");
  });

  test("jeu sorti de la vue : pause automatique ; en course, un glissé ne fait pas défiler", async ({ page }) => {
    await page.goto(`/hobby${E2E}#jeu`);
    const game = page.locator("#jeu");
    await game.getByRole("button", { name: "Jouer", exact: true }).click();
    await waitForScreen(page, "playing");
    const playArea = game.getByRole("application");
    expect(await playArea.evaluate((el) => getComputedStyle(el).touchAction)).toBe("none");
    // Le visiteur remonte la page : le jeu se met en pause tout seul
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await waitForScreen(page, "paused", 5_000);
    expect(await playArea.evaluate((el) => getComputedStyle(el).touchAction)).not.toBe("none");
  });

  test("sauvegarde abîmée : pas de « NaN » sur la carte", async ({ page }) => {
    await page.goto(`/hobby${E2E}#jeu`);
    await page.evaluate(() =>
      localStorage.setItem("rominou:game:e2e", JSON.stringify({ unlocked: 1, best: { geneve: "abc", seoul: -3 }, postcards: ["geneve"] })),
    );
    await page.reload();
    const map = page.locator("#jeu").getByRole("region", { name: "Carte du voyage" });
    await expect(map.getByRole("button", { name: /Séoul/ })).not.toHaveAttribute("aria-disabled", "true");
    expect(await map.textContent()).not.toContain("NaN");
    expect(await map.getByRole("button", { name: /Genève/ }).getAttribute("aria-label")).not.toContain("Record");
  });

  test("anglais : Rominou’s Run, postcard unlocked", async ({ page }) => {
    await page.goto(`/en/hobby${E2E}#jeu`);
    const game = page.locator("#jeu");
    await expect(game.getByRole("heading", { name: "Rominou’s Run" })).toBeVisible();
    await expect(game.getByRole("region", { name: "My postcards" })).toContainText("0 of 9 unlocked");
    await game.getByRole("button", { name: "Play", exact: true }).click();
    await waitForScreen(page, "complete");
    await expect(game.getByRole("dialog", { name: "Postcard unlocked: Geneva" })).toContainText("Greetings from");
  });

  test("rendu 3D : Rominou (GLB) se charge dans le Canvas du jeu", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/hobby?e2e=1#jeu");
    const webgl2 = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
    await page.locator("#jeu").getByRole("button", { name: "Jouer", exact: true }).click();
    await waitForScreen(page, "playing", 75_000);
    expect((await state(page))?.renderer).toBe(webgl2 ? "3d" : "2d");
    if (webgl2) await expect(page.locator("#jeu canvas")).toHaveCount(1);
  });

  test("sans ?e2e=1 : niveaux complets, état non exposé", async ({ page }) => {
    await page.goto("/hobby#jeu");
    await page.locator("#jeu").getByRole("button", { name: "Jouer", exact: true }).click();
    await expect(page.locator("#jeu").getByRole("application")).toBeVisible();
    await page.waitForTimeout(500);
    expect(await state(page)).toBeNull();
  });
});

// Robot : joue de VRAIES étapes (non raccourcies, ?e2e=1&full=1) au clavier, en temps réel, en
// sautant au milieu des fenêtres calculées par le validateur sur le même niveau (déterministe).
// Il lit seulement l'état exposé (x de Rominou) et appuie sur Espace : preuve que les étapes,
// de Genève (tutoriel) à Busan (la plus rapide), se gagnent sans perdre un cœur.
test.describe("robot : étapes complètes", () => {
  test.skip(({ isMobile }) => isMobile, "robot clavier : desktop uniquement");
  test.describe.configure({ timeout: 150_000 });

  const runs: { id: LevelId; mode: GameMode; intro?: RegExp }[] = [
    { id: "geneve", mode: "normal" },
    // Rendu 2D : mot d'accueil générique (pas d'accessoires de la ville en 2D)
    { id: "paris", mode: "normal", intro: /Paris, c.est parti/ },
    { id: "busan", mode: "normal" },
    { id: "busan", mode: "tranquille" },
  ];

  for (const { id, mode, intro } of runs) {
    test(`${id} (${mode}) : de la ligne de départ à la porte`, async ({ page }) => {
      const def = levelDefs().find((d) => d.id === id)!;
      const level = generateLevel(def, { mode });
      const report = validateLevel(level);
      expect(report.ok).toBe(true);
      // Appuis : x de décollage au milieu de chaque fenêtre (et du double saut éventuel).
      const presses = report.plan
        .flatMap((jump) => [jump.step, ...(jump.doubleAfter === null ? [] : [jump.step + jump.doubleAfter])])
        .map((step) => level.startX + level.speed * step * DT);

      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("/hobby?e2e=1&full=1&renderer=2d#jeu");
      await page.evaluate(
        (m) => localStorage.setItem("rominou:game:e2e", JSON.stringify({ unlocked: 8, best: {}, postcards: [], mode: m, sound: false })),
        mode,
      );
      await page.reload();
      const game = page.locator("#jeu");
      const name = levelCards("fr", () => "").find((card) => card.id === id)!.name;
      await game.getByRole("region", { name: "Carte du voyage" }).getByRole("button", { name: new RegExp(`· ${name}`) }).click();
      await game.getByRole("button", { name: "Jouer", exact: true }).click();
      await waitForScreen(page, "playing");
      const started = await state(page);
      expect(started?.levelId).toBe(id);
      expect(started?.mode).toBe(mode);
      if (intro) await expect(game).toContainText(intro);

      // Le robot tourne dans la page (une image = une lecture de l'état) : Espace un peu avant
      // chaque décollage (une demi-image d'avance : l'appui est lu au pas de simulation suivant).
      await page.evaluate(
        ({ xs, speed }) =>
          new Promise<void>((resolve) => {
            let next = 0;
            const tick = () => {
              const s = window.__rominouGame?.state();
              if (!s || s.screen === "complete" || s.screen === "failed") return resolve();
              const lead = (speed * Math.min(Math.max(s.frameMs, 8), 50)) / 2000;
              while (next < xs.length && s.screen === "playing" && s.x >= xs[next] - lead) {
                document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: " ", code: "Space", bubbles: true }));
                next++;
              }
              requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }),
        { xs: presses, speed: level.speed },
      );

      const end = await state(page);
      expect(end?.screen).toBe("complete");
      expect(end?.status).toBe("finished");
      expect(end?.hearts, "aucun cœur perdu").toBe(level.hearts);
      await expect(game.getByRole("dialog", { name: new RegExp("Carte postale débloquée") })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});
