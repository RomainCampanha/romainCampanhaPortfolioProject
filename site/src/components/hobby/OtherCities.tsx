import { useLocale, useTranslations } from "next-intl";
import { pick, profile } from "@/content/profile";
import { Chip } from "@/components/ui/Chip";
import { ClayCard } from "@/components/ui/ClayCard";
import { Coin } from "@/components/ui/Coin";

// Les autres villes visitées (sans photos pour l'instant) : carnet d'adresses en pastilles.
export function OtherCities() {
  const t = useTranslations("hobby.travels");
  const locale = useLocale();

  return (
    <ClayCard as="section" aria-labelledby="other-cities-title" className="mt-14 p-5 sm:mt-16 sm:p-8">
      <div className="flex items-start gap-3.5">
        <Coin icon="pin" tone="lake" />
        <div className="min-w-0">
          <h3 id="other-cities-title" className="type-title">
            {t("otherTitle")}
          </h3>
          <p className="mt-1 font-semibold text-muted">{t("otherIntro")}</p>
        </div>
      </div>
      <ul className="mt-5 flex flex-wrap gap-2.5">
        {profile.otherCities.map((city) => (
          <Chip as="li" key={city.city.en} tone="lake" icon="pin">
            <span>
              <span className="font-extrabold">{pick(city.city, locale)}</span>
              {city.country ? <span className="font-semibold"> · {pick(city.country, locale)}</span> : null}
            </span>
          </Chip>
        ))}
      </ul>
    </ClayCard>
  );
}
