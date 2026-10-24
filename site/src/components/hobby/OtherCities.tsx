import { useLocale, useTranslations } from "next-intl";
import { pick, profile } from "@/content/profile";

// Les autres villes visitées (sans photos pour l'instant).
export function OtherCities() {
  const t = useTranslations("hobby.travels");
  const locale = useLocale();

  return (
    <div className="mt-12">
      <h3 id="other-cities-title" className="font-display text-xl font-bold">
        {t("otherTitle")}
      </h3>
      <p className="mt-2 text-muted">{t("otherIntro")}</p>
      <ul className="mt-5 flex flex-wrap gap-2">
        {profile.otherCities.map((city) => (
          <li
            key={city.city.en}
            className="rounded-full border border-line bg-surface px-4 py-2 text-sm"
          >
            <span className="font-semibold">{pick(city.city, locale)}</span>
            {city.country ? <span className="text-muted"> · {pick(city.country, locale)}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
