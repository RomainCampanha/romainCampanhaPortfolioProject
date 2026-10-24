import { useFormatter } from "next-intl";
import { profile } from "@/content/profile";

/** "YYYY-MM" -> Date (milieu du mois, sans risque de décalage de fuseau). */
function monthToDate(month: string): Date {
  return new Date(`${month}-15T12:00:00Z`);
}

/** Faits de l'emploi actuel, formatés dans la langue courante (ex. "mars 2023", "70 %"). */
export function useWorkFacts() {
  const format = useFormatter();
  const { work } = profile;
  const sinceDate = monthToDate(work.since);

  return {
    company: work.company,
    since: format.dateTime(sinceDate, { month: "long", year: "numeric" }),
    rate: format.number(work.ratePercent / 100, { style: "percent" }),
  };
}
