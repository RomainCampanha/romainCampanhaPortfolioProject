import { useTranslations } from "next-intl";
import { profile } from "@/content/profile";
import { SectionHeading } from "@/components/site/SectionHeading";
import { BoardingPassCard } from "./BoardingPassCard";
import { OtherCities } from "./OtherCities";

// #voyages : une carte d'embarquement par destination, puis les autres villes.
// Phase suivante : globe interactif au-dessus des cartes.
export function TravelsSection() {
  const t = useTranslations("hobby.travels");

  return (
    <section id="voyages" aria-labelledby="voyages-title" className="scroll-mt-20 py-12 sm:py-16">
      <SectionHeading id="voyages-title" title={t("title")} intro={t("intro")} />

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
