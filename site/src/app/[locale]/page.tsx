import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile } from "@/content/profile";
import { buildPageMetadata } from "@/lib/seo";
import { inSentence } from "@/lib/text";
import { PageShell } from "@/components/site/PageShell";
import { GuidedLayout } from "@/components/site/GuidedLayout";
import { RominouGuide } from "@/components/site/RominouGuide";
import { ProHero } from "@/components/pro/ProHero";
import { PathSection } from "@/components/pro/PathSection";
import { SkillsSection } from "@/components/pro/SkillsSection";
import { ProjectSection } from "@/components/pro/ProjectSection";
import { ContactSection } from "@/components/pro/ContactSection";
import { PersonJsonLd } from "@/components/pro/PersonJsonLd";

// Page Pro (accueil). Phase 1 : version texte complète, rendue côté serveur.
// La visite guidée animée de Rominou (phase 2) s'appuiera sur les ids stables
// des sections : #parcours (+ #experience), #competences, #projets, #contact.

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
  const t = useTranslations("pro.guide");
  const tAvatar = useTranslations("common.avatar");

  return (
    <PageShell theme="pro">
      <PersonJsonLd locale={locale as AppLocale} />
      <GuidedLayout
        guideLabel={tAvatar("guideLabel")}
        guide={<RominouGuide label={tAvatar("label")} message={t("bubble")} mobile="hero" desktop="column" />}
      >
        <ProHero />
        <PathSection />
        <SkillsSection />
        <ProjectSection />
        <ContactSection />
      </GuidedLayout>
    </PageShell>
  );
}
