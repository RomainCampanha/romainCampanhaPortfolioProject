import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Tout est indexable sauf l'API du chat. (Les déploiements de preview Vercel
// envoient déjà un en-tête X-Robots-Tag: noindex.)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
