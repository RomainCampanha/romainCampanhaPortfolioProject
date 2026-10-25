import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { pick, profile } from "@/content/profile";
import { routing } from "@/i18n/routing";
import { SITE_NAME, SITE_URL, ogLocale } from "@/lib/seo";
import { PageThemeRoot } from "@/components/site/PageThemeRoot";
import { SkipLink } from "@/components/site/SkipLink";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AvatarStageLoader } from "@/components/three/AvatarStageLoader";
import { TourRoot } from "@/components/tour/TourRoot";
import { fontVariables } from "../fonts";
import "../globals.css";

// Pré-rendu statique de chaque langue ; toute autre valeur de [locale]
// (ex. /fichier.txt, exclu du proxy) -> 404 globale (app/global-not-found.tsx).
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#F5EEE3",
  colorScheme: "light",
  // Zones sûres (encoche, barre d'accueil) : le dock mobile utilise env(safe-area-inset-*)
  viewportFit: "cover",
};

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "common.meta" });

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("defaultTitle", { name: SITE_NAME }), template: `%s · ${SITE_NAME}` },
    description: t("description", {
      name: profile.name,
      city: pick(profile.location, locale),
      guide: profile.guideName,
    }),
    applicationName: SITE_NAME,
    authors: [{ name: profile.name, url: SITE_URL }],
    creator: profile.name,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: ogLocale(locale),
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Rendu statique (la locale est aussi lue via next/root-params dans i18n/request.ts)
  setRequestLocale(locale);
  // Le navigateur ne reçoit que les traductions des composants client du shell
  // (header, langue) ; la page Chat ajoute les siennes (cf. chat/page.tsx).
  const { common } = await getMessages();

  return (
    <html lang={locale} data-scroll-behavior="smooth" className={fontVariables}>
      <body>
        <NextIntlClientProvider messages={{ common }}>
          <PageThemeRoot>
            <SkipLink />
            <SiteHeader name={profile.name} guide={profile.guideName} />
            {/* Canvas 3D unique, persistant entre les pages (client only) */}
            <AvatarStageLoader />
            {/* Visite guidée de Rominou : textes de la langue + chargeur (interface à la demande).
                Avant <main> : la bulle (fixée en bas de l'écran) suit le header dans l'ordre du clavier. */}
            <TourRoot locale={locale} />
            <main id="main" tabIndex={-1} className="site-main">
              {children}
            </main>
            <SiteFooter />
          </PageThemeRoot>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
