import type { ReactNode } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { pick, profile } from "@/content/profile";
import { SectionHeading } from "@/components/site/SectionHeading";
import { GamepadIcon, MusicIcon, TrophyIcon } from "./icons";

const LOL = "League of Legends";

// #musique-jeux (ids stables pour la visite guidée) :
// #lol (carte League of Legends : rôle, meilleur rang, champions — JAMAIS de pseudo),
// #musique (rap français ; sons préférés à venir), #jeu (runner, bientôt).
export function MusicGamesSection() {
  const t = useTranslations("hobby.passions");
  const locale = useLocale();
  const format = useFormatter();
  const lol = profile.gaming.leagueOfLegends;
  const artists = format.list(profile.music.favoriteArtists, { type: "conjunction" });
  const otherGames = format.list(
    profile.gaming.games.filter((game) => game !== LOL),
    { type: "conjunction" },
  );

  return (
    <section id="musique-jeux" aria-labelledby="musique-jeux-title" className="scroll-mt-20 py-12 sm:py-16">
      <SectionHeading id="musique-jeux-title" title={t("title")} intro={t("intro")} />

      <div className="grid gap-4 md:grid-cols-2">
        {lol ? (
          <Card id="lol" icon={<TrophyIcon />} title={t("lol.title")} className="md:col-span-2">
            <dl className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-[auto_auto_minmax(0,1fr)] sm:gap-10">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-accent">{t("lol.role")}</dt>
                <dd className="mt-1 font-display text-2xl font-black">{pick(lol.role, locale)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-widest text-accent">{t("lol.peak")}</dt>
                <dd className="mt-1 font-display text-2xl font-black">{pick(lol.peakRank, locale)}</dd>
              </div>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <dt className="text-xs font-semibold uppercase tracking-widest text-accent">{t("lol.champions")}</dt>
                <dd className="mt-2">
                  <ul className="flex flex-wrap gap-2">
                    {lol.champions.map((champion) => (
                      <li
                        key={champion}
                        className="rounded-full bg-cocoa px-3 py-1 font-display text-xs font-bold tracking-wide text-sun"
                      >
                        {champion}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
            <p className="mt-5 text-muted">{t("lol.otherGames", { games: otherGames })}</p>
          </Card>
        ) : null}

        <Card id="musique" icon={<MusicIcon />} title={t("music.title")}>
          <p className="mt-2 text-muted">{t("music.text", { artists })}</p>
          <p className="mt-4 rounded-xl border-2 border-dashed border-cocoa/25 px-4 py-3 text-sm font-semibold">
            {t("music.soon")}
          </p>
        </Card>

        <Card id="jeu" icon={<GamepadIcon />} title={t("game.title")} badge={<SoonBadge label={t("soon")} />} dashed>
          <p className="mt-2 text-muted">{t("game.text")}</p>
        </Card>
      </div>
    </section>
  );
}

type CardProps = {
  id: string;
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  /** Bordure en pointillés : contenu à venir. */
  dashed?: boolean;
  className?: string;
  children: ReactNode;
};

function Card({ id, icon, title, badge, dashed = false, className = "", children }: CardProps) {
  return (
    <article
      id={id}
      aria-labelledby={`${id}-title`}
      className={`flex h-full scroll-mt-20 flex-col rounded-card bg-surface p-5 sm:p-6 ${
        dashed ? "border-2 border-dashed border-cocoa/30" : "border border-line"
      } ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cocoa text-sun">{icon}</span>
        <h3 id={`${id}-title`} className="font-display text-lg font-bold leading-snug">
          {title}
        </h3>
        {badge ? <span className="ml-auto">{badge}</span> : null}
      </div>
      {children}
    </article>
  );
}

function SoonBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-cocoa px-3 py-1 font-display text-[0.65rem] font-bold uppercase tracking-[0.2em] text-sun">
      {label}
    </span>
  );
}
