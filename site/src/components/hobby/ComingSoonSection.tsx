import type { ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { profile } from "@/content/profile";
import { SectionHeading } from "@/components/site/SectionHeading";
import { GamepadIcon, MusicIcon, TrophyIcon } from "./icons";

const LOL = "League of Legends";

// Teasers des phases suivantes (ids stables pour la visite guidée) :
// #jeu (runner musical), #musique (sons de rap — TODO liste), #lol (carte LoL — TODO détails).
export function ComingSoonSection() {
  const t = useTranslations("hobby.soon");
  const format = useFormatter();
  const artists = format.list(profile.music.favoriteArtists, { type: "conjunction" });
  const otherGames = format.list(
    profile.gaming.games.filter((game) => game !== LOL),
    { type: "conjunction" },
  );

  const teasers: { id: string; icon: ReactNode; title: string; text: string }[] = [
    { id: "jeu", icon: <GamepadIcon />, title: t("game.title"), text: t("game.text") },
    { id: "musique", icon: <MusicIcon />, title: t("music.title"), text: t("music.text", { artists }) },
    { id: "lol", icon: <TrophyIcon />, title: t("lol.title"), text: t("lol.text", { games: otherGames }) },
  ];

  return (
    <section id="bientot" aria-labelledby="bientot-title" className="scroll-mt-20 py-12 sm:py-16">
      <SectionHeading id="bientot-title" title={t("title")} intro={t("intro")} />

      <ul className="grid gap-4 md:grid-cols-3">
        {teasers.map(({ id, icon, title, text }) => (
          <li key={id}>
            <article
              id={id}
              aria-labelledby={`${id}-title`}
              className="flex h-full scroll-mt-20 flex-col rounded-card border-2 border-dashed border-cocoa/30 bg-surface p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-cocoa text-sun">{icon}</span>
                <span className="rounded-full bg-cocoa px-3 py-1 font-display text-[0.65rem] font-bold uppercase tracking-[0.2em] text-sun">
                  {t("badge")}
                </span>
              </div>
              <h3 id={`${id}-title`} className="mt-4 font-display text-lg font-bold leading-snug">
                {title}
              </h3>
              <p className="mt-2 text-muted">{text}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
