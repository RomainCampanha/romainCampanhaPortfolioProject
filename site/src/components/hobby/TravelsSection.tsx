import { useLocale, useTranslations } from "next-intl";
import { pick, profile, type Travel } from "@/content/profile";
import { SectionHeading } from "@/components/site/SectionHeading";
import { cx } from "@/components/ui/cx";
import { BoardingPassCard } from "./BoardingPassCard";
import { OtherCities } from "./OtherCities";
import styles from "./BoardingPass.module.css";

/** Voyages affichés en grande carte d'embarquement (les plus récents) ; les autres : cartes compactes. */
const FEATURED_TRIPS = 2;

// #voyages : une carte d'embarquement par destination (du plus récent au plus ancien) : les
// deux derniers voyages en grand, les plus anciens en cartes compactes (2 colonnes dès 40rem)
// pour une page moins longue ; puis les autres villes. Phase suivante : globe interactif.
export function TravelsSection({ className }: { className?: string }) {
  const t = useTranslations("hobby.travels");
  const locale = useLocale();
  // Intro tirée du profil : nombre de cartes, premier et dernier voyage datés
  // (profile.travels est trié du plus récent au plus ancien).
  const dated = profile.travels.filter((trip) => trip.year !== null);
  const last = dated.at(0);
  const first = dated.at(-1);
  const label = (trip: Travel) => trip.places.map((p) => pick(p.city, locale)).join(" & ");
  const intro =
    first && last && first !== last
      ? t("intro", {
          count: profile.travels.length,
          first: label(first),
          firstYear: String(first.year),
          last: label(last),
          lastYear: String(last.year),
        })
      : t("introShort");

  return (
    <section id="voyages" aria-labelledby="voyages-title" className={cx("scroll-mt-6 pt-14 sm:pt-20", className)}>
      <SectionHeading id="voyages-title" kicker={t("kicker")} kickerIcon="plane" title={t("title")} intro={intro} />

      <ul className={styles.passes}>
        {profile.travels.map((travel, index) => {
          const compact = index >= FEATURED_TRIPS;
          return (
            <li key={travel.id} className={compact ? styles.passCompact : styles.passFull}>
              <BoardingPassCard travel={travel} index={index} compact={compact} />
            </li>
          );
        })}
      </ul>

      <OtherCities />
    </section>
  );
}
