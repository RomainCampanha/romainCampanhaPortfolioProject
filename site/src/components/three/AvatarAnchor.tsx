import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile } from "@/content/profile";
import { cx } from "@/components/ui/cx";
import { Icon } from "@/components/ui/Icon";
import { PAGE_IDS, type PageId } from "@/lib/pages";
import { DEFAULT_SCENE, type AvatarScene } from "@/lib/avatar/scenes";
import type { AvatarAnchorVariant } from "@/lib/avatar/store";
import { AvatarFigure } from "./AvatarFigure";
import { SceneDecor, SceneUnderlay } from "./scenes/SceneDecor";
import { TourCard } from "./TourCard";
import { TypingBubble } from "./TypingBubble";
import styles from "./AvatarAnchor.module.css";

type AvatarAnchorProps = {
  /** hero = plein pied (Pro) ; column = plein pied, colonne (Hobby) ; chat = buste (Chat). */
  variant: AvatarAnchorVariant;
  /**
   * Taille du cadre. La hauteur doit être explicite (container-type: size) : valeurs par défaut
   * dans site.css (.avatar-anchor[data-avatar-anchor=…]), à préciser par la page (className).
   * Réglages fins : --rominou-h, --rominou-x, --rominou-feet / --rominou-top (cf. le CSS module).
   */
  className?: string;
  /** Texte alternatif traduit (ex. « Rominou, l'avatar 3D de Romain »). Sans label : décoratif. */
  label?: string;
  /**
   * Décor du cadre. Défaut selon la variante : hero → "geneva", column → "beach",
   * chat → "dusk". "none" : Rominou seul (sans fenêtre), centré dans l'ancre.
   */
  scene?: AvatarScene;
  /** Carte « Visite du site » (liens Pro / Hobby / Chat, pages vues). Défaut : dans tout cadre avec décor. */
  tour?: boolean;
  /** Légende du décor (pastille épingle). Défaut : la ville du profil avec le décor de Genève ; null = aucune. */
  place?: string | null;
  /**
   * "fill" : sans --rominou-h posé par la page, Rominou remplit la scène sous la bulle (sa tête
   * arrive juste sous la queue, ses pieds restent sur --rominou-feet). Défaut : taille du décor.
   */
  fit?: "fill";
  /**
   * Contenu posé dans la fenêtre, au-dessus du décor (ex. la bulle de Rominou) : en haut, dans
   * le flux (Rominou se place dans l'espace restant) ; en position absolue, il peut déborder.
   */
  children?: ReactNode;
};

// Emplacement de Rominou sur une page, dans un cadre « fenêtre » de la DA Cosy : décor SVG
// (Genève, plage, ciel du soir) derrière le Canvas transparent. Affiche le poster (image fixe,
// même cadre, même décor) tant que la 3D n'est pas prête — et en permanence sans WebGL ou avec
// prefers-reduced-motion. Le Canvas persistant (AvatarStage) se loge dans la boîte de scène de
// l'ancre enregistrée en dernier (AvatarFigure). Composant serveur (faits lus dans profile.ts) :
// le décor n'ajoute aucun JavaScript, seuls Rominou, la bulle « … » et la carte de visite sont
// des composants client.
export function AvatarAnchor({
  variant,
  className,
  label,
  scene = DEFAULT_SCENE[variant],
  tour,
  place,
  fit,
  children,
}: AvatarAnchorProps) {
  const t = useTranslations();
  const locale = useLocale() as AppLocale;
  const geneva = scene === "geneva";
  // Textes de la carte : namespace « pro » (présent côté serveur ; absent d'un arbre client).
  const withTour = (tour ?? scene !== "none") && t.has("pro.stage.quest");
  const total = String(PAGE_IDS.length);
  const placeLabel = place === undefined ? (geneva ? pick(profile.location, locale) : null) : place;

  return (
    <div
      data-avatar-anchor={variant}
      data-scene={scene}
      data-tour={withTour ? "" : undefined}
      data-fit={fit}
      className={cx("avatar-anchor", styles.frame, className)}
    >
      <div className={styles.window}>
        {children ? <div className={styles.overlay}>{children}</div> : null}

        <div className={styles.ground}>
          {scene !== "none" ? (
            <div aria-hidden="true" className={styles.decor}>
              <SceneDecor scene={scene} />
            </div>
          ) : null}
          <AvatarFigure
            variant={variant}
            label={label}
            underlay={<SceneUnderlay scene={scene} />}
            extra={scene === "dusk" ? <TypingBubble /> : null}
          />
        </div>

        {placeLabel ? (
          // Légende du décor : la ville est déjà dans le contenu de la page
          <p aria-hidden="true" className={styles.chip}>
            <Icon name="pin" />
            {placeLabel}
          </p>
        ) : null}
      </div>

      {withTour ? (
        <TourCard
          title={t("pro.stage.quest")}
          doneTitle={t("pro.stage.done")}
          steps={Object.fromEntries(PAGE_IDS.map((id) => [id, t(`common.nav.${id}`)])) as Record<PageId, string>}
          progress={PAGE_IDS.map((_, index) => t("pro.stage.progress", { current: String(index + 1), total }))}
          progressLabel={PAGE_IDS.map((_, index) => t("pro.stage.progressLabel", { current: index + 1, total }))}
        />
      ) : null}
    </div>
  );
}
