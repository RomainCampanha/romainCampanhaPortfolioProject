import { useLocale, useTranslations } from "next-intl";
import { pick, profile } from "@/content/profile";
import { inSentence } from "@/lib/text";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Chip } from "@/components/ui/Chip";
import { ClayCard } from "@/components/ui/ClayCard";
import { Coin } from "@/components/ui/Coin";
import { cx } from "@/components/ui/cx";
import { GameSection } from "@/components/game/GameSection";
import { FEATURED_GAME, LOL } from "./games";
import { CassetteArt, RankGem } from "./icons";

// #musique-jeux (ids stables pour la visite guidée et le chat) :
// #musique (rap français qu'il ÉCOUTE : il ne fait pas de musique ; sons préférés à venir),
// #lol (carte League of Legends : rôle, meilleur rang, champions — JAMAIS de pseudo — et les
// autres jeux), #jeu (« La course de Rominou », le mini-jeu : components/game).
export function MusicGamesSection({ className }: { className?: string }) {
  const t = useTranslations("hobby.passions");
  const locale = useLocale();

  return (
    <section
      id="musique-jeux"
      aria-labelledby="musique-jeux-title"
      className={cx("scroll-mt-6 pt-20 sm:pt-28", className)}
    >
      {/* Titre + cartes musique / LoL : zone commentée par la visite (le jeu a sa propre étape) */}
      <div data-tour-anchor="musique-jeux">
        <SectionHeading
          id="musique-jeux-title"
          kicker={t("kicker")}
          kickerIcon="headphones"
          title={t("title")}
          intro={t("intro", { genre: inSentence(pick(profile.music.genre, locale), locale) })}
        />

        <div className="grid gap-x-7 gap-y-10 md:grid-cols-2">
          <MusicCard />
          <LolCard />
        </div>
      </div>
      <GameSection className="mt-10" />
    </section>
  );
}

function CardHeader({ id, icon, kicker, title }: { id: string; icon: "headphones" | "gamepad"; kicker: string; title: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <Coin icon={icon} size="lg" className="text-tone-800" />
      <div className="min-w-0">
        <p className="type-kicker text-tone-800">{kicker}</p>
        <h3 id={id} className="type-title mt-0.5">
          {title}
        </h3>
      </div>
    </div>
  );
}

/** Le coin musique (lilas) : cassette décorative + ses rappeurs préférés (il écoute, il ne fait pas). */
function MusicCard() {
  const t = useTranslations("hobby.passions.music");
  const locale = useLocale();
  // Ses mots (profil) : « Grand fan de rap français, surtout de Vald et Damso. »
  const description = profile.hobbies.find((hobby) => hobby.id === "music")?.description;

  return (
    <ClayCard
      as="article"
      id="musique"
      aria-labelledby="musique-title"
      tone="lilac"
      className="flex scroll-mt-6 flex-col p-6 sm:p-7"
    >
      <CardHeader id="musique-title" icon="headphones" kicker={t("kicker")} title={t("title")} />
      <div className="my-6 flex justify-center">
        <CassetteArt
          label={pick(profile.music.genre, locale)}
          className="w-full max-w-60 -rotate-3 drop-shadow-[0_10px_12px_color-mix(in_srgb,var(--color-clay-edge)_22%,transparent)]"
        />
      </div>
      {description ? <p className="text-lg font-bold">{pick(description, locale)}</p> : null}
      <div className="mt-auto pt-5">
        <p className="rounded-clay-md border-2 border-dashed border-tone-300 px-4 py-3 text-sm font-bold text-tone-800">
          {t("soon")}
        </p>
      </div>
    </ClayCard>
  );
}

/** Carte de joueur League of Legends (lac) : rôle, meilleur rang, champions, puis les autres jeux. */
function LolCard() {
  const t = useTranslations("hobby.passions.lol");
  const locale = useLocale();
  const lol = profile.gaming.leagueOfLegends;
  const otherGames = profile.gaming.games.filter((game) => game !== LOL);
  if (!lol) return null;

  return (
    <ClayCard as="article" id="lol" aria-labelledby="lol-title" tone="lake" className="scroll-mt-6 p-6 sm:p-7">
      <CardHeader id="lol-title" icon="gamepad" kicker={t("kicker")} title={t("title")} />

      <dl className="mt-6 grid gap-3.5 min-[25rem]:grid-cols-2">
        <div className="flex flex-col justify-between rounded-clay-md bg-cream px-4 py-3.5 shadow-[0_4px_0_var(--tone-300)]">
          <dt className="type-kicker text-tone-800">{t("role")}</dt>
          <dd className="type-title mt-1.5">{pick(lol.role, locale)}</dd>
        </div>
        <div className="flex flex-col justify-between rounded-clay-md bg-cream px-4 py-3.5 shadow-[0_4px_0_var(--tone-300)]">
          <dt className="type-kicker text-tone-800">{t("peak")}</dt>
          <dd className="mt-1.5 flex items-center justify-between gap-2">
            <span className="type-title">{pick(lol.peakRank, locale)}</span>
            <RankGem size={36} className="hidden shrink-0 min-[25rem]:block" />
          </dd>
        </div>
        <div className="mt-2 min-[25rem]:col-span-2">
          <dt className="type-kicker text-tone-800">{t("champions")}</dt>
          <dd className="mt-2.5">
            <ul className="flex flex-wrap gap-2">
              {lol.champions.map((champion) => (
                <Chip as="li" key={champion} tone="lake" className="bg-cream">
                  {champion}
                </Chip>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      {otherGames.length > 0 ? (
        <div className="mt-6 border-t-2 border-dashed border-tone-300 pt-5">
          <h4 id="lol-other-games" className="type-kicker text-tone-800">
            {t("otherGames")}
          </h4>
          <ul aria-labelledby="lol-other-games" className="mt-2.5 flex flex-wrap gap-2">
            {otherGames.map((game) => (
              <Chip
                as="li"
                key={game}
                tone={game === FEATURED_GAME ? "sage" : "lake"}
                icon={game === FEATURED_GAME ? "leaf" : "gamepad"}
                className="bg-cream"
              >
                {game}
              </Chip>
            ))}
          </ul>
        </div>
      ) : null}
    </ClayCard>
  );
}
