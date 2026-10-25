import { useTranslations } from "next-intl";
import { AvatarAnchor } from "@/components/three/AvatarAnchor";
import { TourInvite } from "@/components/tour/TourInvite";
import { TourSlot } from "@/components/tour/TourSlot";
import { profile } from "@/content/profile";
import { cx, SpeechBubble } from "@/components/ui";
import styles from "./HeroStage.module.css";

/** Queue de la bulle : au-dessus de la tête de Rominou sur mobile / tablette (même axe : 55 %,
 * cf. CSS), vers lui à droite sur desktop. Partagée avec la bulle de la visite guidée. */
const BUBBLE_TAIL = { tail: "bottom", tailOffset: "55%", tailLg: "right", tailOffsetLg: "5.25rem" } as const;

// Le « diorama » du hero Pro : Rominou, le guide, debout sur son île du Léman, avec sa boîte
// de dialogue. Le cadre (fenêtre, décor de Genève, île, légende « Genève », carte « Visite du
// site 1/3 ») est dessiné par l'ancre (components/three) ; la page ne pose que la bulle, qui
// invite à la visite guidée (« Je te fais visiter ? »). Pendant la première étape de la visite,
// la bulle de la visite prend sa place (TourSlot) : Rominou parle depuis son île.
export function HeroStage({ className }: { className?: string }) {
  const t = useTranslations("pro");
  const tCommon = useTranslations("common");

  return (
    <aside aria-label={tCommon("avatar.guideLabel")} data-tour-anchor="hero" className={cx(styles.stage, className)}>
      <AvatarAnchor
        variant="hero"
        label={tCommon("avatar.label", { name: profile.firstName })}
        fit="fill"
        className={styles.anchor}
      >
        <TourSlot {...BUBBLE_TAIL} className={styles.bubble}>
          <SpeechBubble {...BUBBLE_TAIL} className={styles.bubble}>
            <p>{t("guide.bubble", { name: profile.firstName })}</p>
            <TourInvite
              question={t("guide.invite.question")}
              start={t("guide.invite.start")}
              decline={t("guide.invite.decline")}
              declined={t("guide.invite.declined")}
            />
          </SpeechBubble>
        </TourSlot>
      </AvatarAnchor>
    </aside>
  );
}
