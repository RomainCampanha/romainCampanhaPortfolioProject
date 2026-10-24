import { useFormatter, useLocale, useTranslations } from "next-intl";
import { pick, profile } from "@/content/profile";
import { inSentence } from "@/lib/text";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { Sticker } from "@/components/ui/Sticker";
import { FEATURED_GAME } from "./games";
import styles from "./HobbyPage.module.css";

// Intro de la page Hobby : sur-titre, h1, chapeau et stickers de passions (faits du profil :
// rappeurs préférés, carte LoL, jeu mis en avant). Les stickers flottent doucement
// (coupé si mouvement réduit) ; texte visible abrégé + version complète pour les lecteurs d'écran.
export function HobbyHero({ className }: { className?: string }) {
  const t = useTranslations("hobby.hero");
  const locale = useLocale();
  const format = useFormatter();
  const lol = profile.gaming.leagueOfLegends;
  const artists = profile.music.favoriteArtists;
  const featuredGame = profile.gaming.games.find((game) => game === FEATURED_GAME);

  return (
    <section aria-labelledby="hobby-title" className={className}>
      <div className={styles.heroInner}>
        <div className={styles.heroText}>
          <SectionKicker icon="heart">{t("kicker")}</SectionKicker>
          <h1 id="hobby-title" className="type-hero mt-4">
            {t("title")}
          </h1>
          <p className="type-lede mt-5 max-w-[42ch]">{t("intro", { genre: inSentence(pick(profile.music.genre, locale), locale) })}</p>
        </div>

        <ul aria-label={t("listLabel")} className={styles.stickers}>
          {artists.length > 0 ? (
            <li className={styles.floating}>
              <Sticker tone="lilac" icon="headphones" size="lg" tilt={-5}>
                <span aria-hidden="true">{artists.join(" & ")}</span>
                <span className="sr-only">
                  {t("musicSr", {
                    genre: pick(profile.music.genre, locale),
                    artists: format.list(artists, { type: "conjunction" }),
                  })}
                </span>
              </Sticker>
            </li>
          ) : null}
          {lol ? (
            <li className={styles.floating}>
              <Sticker tone="lake" icon="gamepad" size="lg" tilt={3}>
                <span aria-hidden="true">
                  {t("lol", { role: pick(lol.role, locale), rank: pick(lol.peakRank, locale) })}
                </span>
                <span className="sr-only">
                  {t("lolSr", { role: pick(lol.role, locale), rank: pick(lol.peakRank, locale) })}
                </span>
              </Sticker>
            </li>
          ) : null}
          {featuredGame ? (
            <li className={styles.floating}>
              <Sticker tone="sage" icon="leaf" size="lg" tilt={-3}>
                {featuredGame}
              </Sticker>
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}
