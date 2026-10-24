import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { loadMessages } from "./messages";
import { routing } from "./routing";

// Config par requête : la locale vient du segment racine [locale]
// (next/root-params, recommandé par next-intl 4 pour Next >= 16.3),
// sauf si un appel passe une locale explicite (ex. getTranslations({ locale })
// depuis un Route Handler, où root-params n'est pas disponible).
export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await rootParams.locale();
    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else {
      notFound();
    }
  }

  const safeLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  return {
    locale: safeLocale,
    messages: await loadMessages(safeLocale),
    // Fuseau fixe pour éviter les écarts serveur/client
    timeZone: "Europe/Zurich",
  };
});
