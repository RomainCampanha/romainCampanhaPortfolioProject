import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile } from "@/content/profile";
import { buildPageMetadata } from "@/lib/seo";
import { inSentence } from "@/lib/text";
import { PageShell } from "@/components/site/PageShell";
import { ProHero } from "@/components/pro/ProHero";
import { PathSection } from "@/components/pro/PathSection";
import { SkillsSection } from "@/components/pro/SkillsSection";
import { ProjectSection } from "@/components/pro/ProjectSection";
import { ContactSection } from "@/components/pro/ContactSection";
import { PersonJsonLd } from "@/components/pro/PersonJsonLd";

// Page Pro (accueil), direction « Cosy » : hero + diorama de Rominou sur son île du Léman
// (complementary « Rominou, le guide »), mur des diplômes, inventaire des compétences,
// projet (dans une bande ondulée, pour le rythme) et contact. Version texte complète, rendue
// côté serveur. Page pleine largeur (bleed) : chaque bloc pose son conteneur.
// Ids stables (visite guidée de Rominou, chat) : #parcours (+ #experience), #competences,
// #projets, #contact.

// Page statique. Pas de `revalidate` ici : avec l'ISR, Next 16.4 laisse une requête de
// prefetch de "/" pendante sur l'accueil (constaté en local). L'âge se met à jour dans
// le navigateur (cf. components/site/Age.tsx).

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = (await params).locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "pro.meta" });
  return buildPageMetadata({
    locale,
    path: "/",
    title: t("title", { name: profile.name }),
    description: t("description", {
      name: profile.name,
      headline: inSentence(pick(profile.headline, locale), locale),
    }),
    absoluteTitle: true,
  });
}

export default function ProPage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale as AppLocale);

  return (
    <PageShell theme="pro" bleed>
      <PersonJsonLd locale={locale as AppLocale} />
      <div className="site-container">
        <ProHero />
        <PathSection />
        <SkillsSection />
      </div>
      <ProjectSection />
      <div className="site-container">
        <ContactSection />
      </div>
    </PageShell>
  );
}
