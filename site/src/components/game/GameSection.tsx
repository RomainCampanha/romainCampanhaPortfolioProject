import { NextIntlClientProvider, useLocale, useMessages, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile } from "@/content/profile";
import { levelCards } from "@/lib/game/catalog";
import { ClayCard } from "@/components/ui/ClayCard";
import { Coin } from "@/components/ui/Coin";
import { cx } from "@/components/ui/cx";
import { RunnerGame } from "./RunnerGame";

// #jeu : « La course de Rominou » (Hobby). Composant serveur : niveaux dérivés du profil
// (catalog.ts) et traduits ici, puis l'îlot client RunnerGame (écran titre, carte du voyage,
// cartes postales). Le moteur du jeu (simulation, 3D) n'est téléchargé qu'au clic sur « Jouer ».
// Ids stables : #jeu (visite guidée), #jeu-title.
export function GameSection({ className }: { className?: string }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("game");
  // Traductions envoyées au navigateur : le jeu + le cartouche « Rominou, le guide » des bulles.
  const { game, common } = useMessages();
  const levels = levelCards(locale, (id) => t(`captions.${id}`));

  return (
    <ClayCard
      as="article"
      id="jeu"
      aria-labelledby="jeu-title"
      className={cx("scroll-mt-6 p-4 min-[25rem]:p-5 sm:p-8", className)}
    >
      <div className="flex items-center gap-4 px-1 sm:px-0">
        <Coin icon="gamepad" tone="butter" size="lg" />
        <div className="min-w-0">
          <p className="type-kicker text-accent">{t("section.kicker")}</p>
          <h3 id="jeu-title" className="type-h3 mt-1">
            {t("section.title")}
          </h3>
        </div>
      </div>
      <p className="mt-4 max-w-[62ch] px-1 font-semibold text-muted sm:px-0">
        {t("section.text", { city: pick(profile.location, locale) })}
      </p>

      <NextIntlClientProvider messages={{ game, common: { avatar: common.avatar } }}>
        <RunnerGame levels={levels} />
      </NextIntlClientProvider>
    </ClayCard>
  );
}
