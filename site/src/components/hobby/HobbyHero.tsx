import { useLocale, useTranslations } from "next-intl";
import { pick, profile } from "@/content/profile";
import { HOBBY_ICONS } from "./icons";

// Hero de la page Hobby : titre, intro et les passions en bref (depuis profile.hobbies).
export function HobbyHero() {
  const t = useTranslations("hobby.hero");
  const locale = useLocale();

  return (
    <section aria-labelledby="hobby-title" className="pb-10 pt-6 sm:pt-10 lg:pt-14">
      <h1 id="hobby-title" className="font-display text-4xl font-black leading-tight sm:text-6xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-2xl text-lg sm:text-xl">{t("intro")}</p>

      <ul aria-label={t("listLabel")} className="mt-8 grid gap-3 sm:grid-cols-2">
        {profile.hobbies.map((hobby) => {
          const HobbyIcon = HOBBY_ICONS[hobby.id];
          return (
            <li key={hobby.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cocoa text-sun">
                <HobbyIcon />
              </span>
              <span>
                <span className="block font-display text-sm font-bold tracking-wide">
                  {pick(hobby.label, locale)}
                </span>
                <span className="mt-1 block text-sm text-muted">{pick(hobby.description, locale)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
