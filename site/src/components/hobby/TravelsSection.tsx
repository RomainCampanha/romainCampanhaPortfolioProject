import { useLocale, useTranslations } from "next-intl";
import { pick, profile, type Travel } from "@/content/profile";
import { SectionHeading } from "@/components/site/SectionHeading";
import { BoardingPassCard } from "./BoardingPassCard";
import { OtherCities } from "./OtherCities";

// #voyages : une carte d'embarquement par destination, puis les autres villes.
// Phase suivante : globe interactif au-dessus des cartes.
export function TravelsSection() {
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
    <section id="voyages" aria-labelledby="voyages-title" className="scroll-mt-20 py-12 sm:py-16">
      <SectionHeading id="voyages-title" title={t("title")} intro={intro} />

      <ul className="grid gap-10">
        {profile.travels.map((travel) => (
          <li key={travel.id}>
            <BoardingPassCard travel={travel} />
          </li>
        ))}
      </ul>

      <OtherCities />
    </section>
  );
}
