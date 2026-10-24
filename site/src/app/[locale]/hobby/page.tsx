import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile } from "@/content/profile";
import { buildPageMetadata } from "@/lib/seo";
import { inSentence } from "@/lib/text";
import { PageShell } from "@/components/site/PageShell";
import { HobbyOutfit } from "@/components/hobby/HobbyOutfit";
import { HobbyHero } from "@/components/hobby/HobbyHero";
import { HobbyGuide } from "@/components/hobby/HobbyGuide";
import { TravelsSection } from "@/components/hobby/TravelsSection";
import { MusicGamesSection } from "@/components/hobby/MusicGamesSection";
import styles from "@/components/hobby/HobbyPage.module.css";

// Page Hobby (thème pêche, « Cosy ») : intro + stickers, Rominou en tenue de vacances,
// cartes d'embarquement (+ albums photo), musique & jeux.
// Ids stables : #voyages (+ une carte par voyage = son id dans profile.travels, ex. #busan,
// #tokyo, #brighton-dubrovnik ; l'outil showTrip du chat y mène et ouvre l'album),
// #musique-jeux (#musique, #lol, #jeu).

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

  // Grille de la page (HobbyPage.module.css) : intro | Rominou, puis les sections.
  // Dès 80rem, Rominou reste dans une colonne collante à droite pendant toute la visite.
  return (
    <PageShell theme="hobby" className={styles.page}>
      <HobbyOutfit />
      <HobbyHero className={styles.hero} />
      <HobbyGuide className={styles.guide} />
      <TravelsSection className={styles.section} />
      <MusicGamesSection className={styles.section} />
    </PageShell>
  );
}
