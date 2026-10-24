import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Chromium préinstallé (sandbox / CI) si présent, sinon navigateur bundlé de Playwright.
const LOCAL_CHROMIUM = "/opt/pw-browsers/chromium";
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ??
  (existsSync(LOCAL_CHROMIUM) ? LOCAL_CHROMIUM : undefined);

const PORT = Number(process.env.E2E_PORT ?? 3100);
const MOCK_PORT = Number(process.env.E2E_MOCK_PORT ?? 4299);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Accept-Language fr : sinon next-intl redirige / vers /en (détection de langue)
    locale: "fr-CH",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        locale: "fr-CH",
        launchOptions: { executablePath },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        locale: "fr-CH",
        launchOptions: { executablePath },
      },
    },
  ],
  // Nécessite un build préalable : npm run build
  webServer: [
    {
      // Faux OpenAI : le chat est testé de bout en bout sans clé ni coût
      command: "node e2e/mock-openai.mjs",
      port: MOCK_PORT,
      env: { E2E_MOCK_PORT: String(MOCK_PORT) },
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      env: {
        OPENAI_API_KEY: "e2e-test-key",
        OPENAI_BASE_URL: `http://localhost:${MOCK_PORT}/v1`,
        // Pas de jeton OIDC Vercel en local : BotID désactivé (ignoré en production)
        BOTID_DISABLED: "1",
        // Tous les tests partagent l'IP "local" : limites larges
        CHAT_RATE_LIMIT_PER_MINUTE: "1000",
        CHAT_DAILY_GLOBAL_LIMIT: "100000",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
