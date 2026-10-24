import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withBotId } from "botid/next/config";

// next-intl : charge la config de requête (locale + messages)
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Date de build (YYYY-MM-DD), affichée dans le footer ("mis à jour le").
// Peut être forcée via NEXT_PUBLIC_LAST_UPDATED (ex. dans la CI).
const lastUpdated =
  process.env.NEXT_PUBLIC_LAST_UPDATED || new Date().toISOString().slice(0, 10);

/** En-têtes de sécurité, sur toutes les réponses. */
const SECURITY_HEADERS = [
  // Le site ne peut pas être affiché dans une iframe d'un autre site (clickjacking)
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Aucune API sensible utilisée (caméra, micro, géolocalisation… : toutes coupées)
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  // Pas d'en-tête "X-Powered-By: Next.js"
  poweredByHeader: false,
  // Cache Components (défaut create-next-app 16.4) volontairement désactivé en phase 1 :
  // site quasi statique, rendu statique classique (generateStaticParams + setRequestLocale)
  // et moins de contraintes pour les features client (usePathname, Date, etc.).
  cacheComponents: false,
  experimental: {
    // 404 pour les URLs hors [locale] (ex. /fichier-inconnu.txt)
    globalNotFound: true,
  },
  env: {
    NEXT_PUBLIC_LAST_UPDATED: lastUpdated,
  },
  // Seules les photos de voyage passent par l'optimiseur (posters, logos, icônes : unoptimized).
  // Réglages sobres pour le quota de transformations de Vercel Hobby : WebP seulement
  // (un format = une transformation par taille), tailles bornées à la largeur des
  // sources (1600 px) et cache long (fichiers rarement modifiés).
  images: {
    formats: ["image/webp"],
    deviceSizes: [640, 828, 1080, 1600],
    imageSizes: [256, 384],
    minimumCacheTTL: 2_678_400, // 31 jours
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        // Modèles 3D, photos, logos, posters de Rominou (public/scenes : image LCP du hero) et
        // captures de projets : rarement modifiés. Noms non hashés, donc pas "immutable" :
        // 1 jour de cache, puis revalidation.
        source: "/:dir(models|photos|brand|scenes|projects)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

// withBotId ajoute les rewrites du challenge Vercel BotID (protège POST /api/chat)
export default withBotId(withNextIntl(nextConfig));
