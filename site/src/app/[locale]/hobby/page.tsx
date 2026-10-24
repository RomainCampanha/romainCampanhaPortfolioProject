import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile } from "@/content/profile";
import { buildPageMetadata } from "@/lib/seo";
import { inSentence } from "@/lib/text";
import { PageShell } from "@/components/site/PageShell";
import { GuidedLayout } from "@/components/site/GuidedLayout";
import { RominouGuide } from "@/components/site/RominouGuide";
import { HobbyOutfit } from "@/components/hobby/HobbyOutfit";
import { HobbyHero } from "@/components/hobby/HobbyHero";
import { TravelsSection } from "@/components/hobby/TravelsSection";
import { ComingSoonSection } from "@/components/hobby/ComingSoonSection";

// Page Hobby. Phase 1 : voyages (cartes d'embarquement + photos) et teasers.
// Ids stables : #voyages (+ une carte par voyage : #seoul, #toronto, #brighton-dubrovnik,
// #tokyo, #shanghai), #bientot (#jeu, #musique, #lol).

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/hobby">): Promise<Metadata> {
  const locale = (await params).locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "hobby.meta" });
  const format = await getFormatter({ locale });
  // Faits tirés du profil : 3 premiers voyages avec photos, genre musical, jeux
  const places = profile.travels
    .filter((trip) => trip.photos === "available")
    .slice(0, 3)
    .map((trip) => trip.places.map((p) => pick(p.city, locale)).join(" & "))
    .join(", ");
  return buildPageMetadata({
    locale,
    path: "/hobby",
    title: t("title"),
    description: t("description", {
      name: profile.name,
      places,
      music: inSentence(pick(profile.music.genre, locale), locale),
      games: format.list(profile.gaming.games, { type: "conjunction" }),
    }),
  });
}

export default function HobbyPage({ params }: PageProps<"/[locale]/hobby">) {
  const { locale } = use(params);
  setRequestLocale(locale as AppLocale);
  const t = useTranslations("hobby.guide");
  const tAvatar = useTranslations("common.avatar");

  return (
    <PageShell theme="hobby">
      <HobbyOutfit />
      <GuidedLayout
        guideLabel={tAvatar("guideLabel")}
        guide={<RominouGuide label={t("label")} message={t("bubble")} mobile="hero" desktop="column" />}
      >
        <HobbyHero />
        <TravelsSection />
        <ComingSoonSection />
      </GuidedLayout>
    </PageShell>
  );
}
