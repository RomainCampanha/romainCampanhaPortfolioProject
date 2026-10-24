import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { photos } from "@/content/photos";
import { PAGE_IDS, PAGE_PATHS, type PageId } from "@/lib/pages";
import { SITE_URL, localizedPath } from "@/lib/seo";

// Date de build (YYYY-MM-DD, injectée par next.config.ts)
const LAST_UPDATED = process.env.NEXT_PUBLIC_LAST_UPDATED ?? "2026-01-01";

const PRIORITY: Record<PageId, number> = { pro: 1, hobby: 0.8, chat: 0.6 };

// Une entrée par page et par langue, avec les alternatives hreflang (+ x-default)
// et les photos de voyage pour la page Hobby (sitemap d'images).
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGE_IDS.flatMap((id) => {
    const path = PAGE_PATHS[id];
    const languages: Record<string, string> = Object.fromEntries(
      routing.locales.map((l) => [l, `${SITE_URL}${localizedPath(l, path)}`]),
    );
    languages["x-default"] = `${SITE_URL}${localizedPath(routing.defaultLocale, path)}`;
    const images = id === "hobby" ? photos.map((photo) => `${SITE_URL}${photo.src}`) : undefined;

    return routing.locales.map((locale) => ({
      url: `${SITE_URL}${localizedPath(locale, path)}`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly" as const,
      priority: PRIORITY[id],
      alternates: { languages },
      ...(images?.length ? { images } : {}),
    }));
  });
}
