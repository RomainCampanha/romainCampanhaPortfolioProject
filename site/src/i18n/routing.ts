import { defineRouting } from "next-intl/routing";

// fr = langue par défaut, servie à la racine (/), en = /en
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];
