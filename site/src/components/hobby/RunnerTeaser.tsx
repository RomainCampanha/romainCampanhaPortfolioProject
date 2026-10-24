import type { CSSProperties, ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { pick, profile } from "@/content/profile";
import { ClayCard } from "@/components/ui/ClayCard";
import { Coin } from "@/components/ui/Coin";
import { Icon } from "@/components/ui/Icon";
import { RominouHead } from "@/components/ui/RominouHead";
import { Sticker } from "@/components/ui/Sticker";
import { cx } from "@/components/ui/cx";
import type { Tone } from "@/components/ui/tones";

/** Couleur des cartes postales, en alternance. */
const POSTCARD_TONES: readonly Tone[] = ["lake", "peach", "lilac", "butter"];

// #jeu : teaser du futur jeu, « La course de Rominou ». Un runner à travers ses voyages :
// départ de Genève (profile.location), puis un niveau par voyage, du plus ancien au plus
// récent (profile.travels est trié du plus récent au plus ancien) ; chaque niveau débloquera
// la carte postale de la ville. Rien de jouable encore : badge « Bientôt ».
export function RunnerTeaser({ className }: { className?: string }) {
  const t = useTranslations("hobby.passions");
  const locale = useLocale();
  const levels = [...profile.travels].reverse();

  return (
    <ClayCard
      as="article"
      id="jeu"
      aria-labelledby="jeu-title"
      className={cx("scroll-mt-6 p-6 sm:p-8", className)}
    >
      {/* Sticker « Bientôt » collé sur le bord de la carte */}
      <Sticker tone="butter" tilt={5} size="lg" className="absolute -top-4 right-5 animate-float sm:right-8">
        {t("soon")}
      </Sticker>
      <div className="flex items-center gap-4">
        <Coin icon="gamepad" tone="butter" size="lg" />
        <div className="min-w-0">
          <p className="type-kicker text-accent">{t("game.kicker")}</p>
          <h3 id="jeu-title" className="type-h3 mt-1">
            {t("game.title")}
          </h3>
        </div>
      </div>
      <p className="mt-4 max-w-[62ch] font-semibold text-muted">{t("game.text")}</p>

      <ol aria-label={t("game.levelsLabel")} className="mt-7 grid gap-3 min-[25rem]:grid-cols-2 min-[25rem]:gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        <li>
          <Postcard tone="sage" tilt={-1.5}>
            <span className="block min-w-0">
              <span className="type-kicker block text-tone-800 min-[25rem]:pr-7">{t("game.start")}</span>
              <span className="type-title mt-1 block">{pick(profile.location, locale)}</span>
            </span>
            <RominouHead size={36} outfit="vacances" className="animate-float min-[25rem]:mt-2.5" />
          </Postcard>
        </li>
        {levels.map((travel, index) => (
          <li key={travel.id}>
            <Postcard tone={POSTCARD_TONES[index % POSTCARD_TONES.length]} tilt={index % 2 === 0 ? 1.2 : -1}>
              <span className="block min-w-0">
                <span className="type-kicker block text-tone-800 min-[25rem]:pr-7">{t("game.level", { n: index + 1 })}</span>
                <span className="type-title mt-1 block">
                  {travel.places.map((p) => pick(p.city, locale)).join(" & ")}
                </span>
              </span>
              <span className="flex max-w-36 items-start gap-1.5 text-[0.8125rem] font-extrabold leading-tight text-tone-800 min-[25rem]:mt-2.5 min-[25rem]:max-w-none">
                <Icon name="lock" size={16} className="mt-px" />
                {t("game.locked")}
              </span>
            </Postcard>
          </li>
        ))}
      </ol>
    </ClayCard>
  );
}

/** Carte postale pastel penchée, avec l'emplacement du timbre en pointillés (décor). */
function Postcard({ tone, tilt, children }: { tone: Tone; tilt: number; children: ReactNode }) {
  return (
    <div
      data-tone={tone}
      style={{ rotate: `${tilt}deg` } as CSSProperties}
      className="relative flex h-full flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-clay-md bg-tone-100 px-3.5 pb-3.5 pt-3 shadow-[0_4px_0_var(--tone-300)] min-[25rem]:block min-[25rem]:px-3"
    >
      <span
        aria-hidden="true"
        className="absolute right-2.5 top-2.5 hidden size-6 rounded-[5px] border-2 border-dashed border-tone-300 min-[25rem]:block"
      />
      {children}
    </div>
  );
}
