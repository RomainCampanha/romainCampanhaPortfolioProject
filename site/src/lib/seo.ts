import type { Metadata } from "next";
import { profile } from "@/content/profile";
import { getPathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import type { PagePath } from "./pages";
import { SITE_URL } from "./site-url";

export { SITE_URL };

/** Nom du site = nom de Romain (profil). */
export const SITE_NAME = profile.name;

/** Chemin localisé : "/hobby" (fr) ou "/en/hobby" (en). */
export function localizedPath(locale: AppLocale, path: PagePath): string {
  return getPathname({ locale, href: path });
}

/** canonical + hreflang (fr, en, x-default) pour une page donnée. */
export function buildAlternates(
  locale: AppLocale,
  path: PagePath,
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = localizedPath(l, path);
  }
  languages["x-default"] = localizedPath(routing.defaultLocale, path);

  return { canonical: localizedPath(locale, path), languages };
}

/** Locale Open Graph (fr_CH / en_US). */
export function ogLocale(locale: AppLocale): string {
  return locale === "fr" ? "fr_CH" : "en_US";
}

/** Image de partage par défaut (1200×630, public/brand/og.jpg, sans texte localisé). */
export const DEFAULT_OG_IMAGE = {
  url: "/brand/og.jpg",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} · Portfolio`,
} as const;

/**
 * Metadata standard d'une page (titre, description, hreflang, Open Graph, Twitter).
 * openGraph est redéfini en entier ici : Next.js ne fusionne pas l'objet openGraph du
 * layout avec celui de la page (siteName, type et image doivent donc être répétés).
 */
export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
  image = DEFAULT_OG_IMAGE,
}: {
  locale: AppLocale;
  path: PagePath;
  title: string;
  description: string;
  /** true : n'applique pas le template "%s · Romain Campanha" */
  absoluteTitle?: boolean;
  /** Image de partage (défaut : DEFAULT_OG_IMAGE). */
  image?: { url: string; width: number; height: number; alt: string };
}): Metadata {
  const alternates = buildAlternates(locale, path);
  // Le template "%s · Romain Campanha" ne s'applique qu'à <title> : on l'applique aussi au partage.
  const shareTitle = absoluteTitle ? title : `${title} · ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: shareTitle,
      description,
      url: alternates.canonical,
      locale: ogLocale(locale),
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map(ogLocale),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [image.url],
    },
  };
}
