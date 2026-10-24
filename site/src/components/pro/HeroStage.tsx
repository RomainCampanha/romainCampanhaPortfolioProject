import { useTranslations } from "next-intl";
import { AvatarAnchor } from "@/components/three/AvatarAnchor";
import { profile } from "@/content/profile";
import { cx, SpeechBubble } from "@/components/ui";
import styles from "./HeroStage.module.css";

// Le « diorama » du hero Pro : Rominou, le guide, debout sur son île du Léman, avec sa boîte
// de dialogue. Le cadre (fenêtre, décor de Genève, île, légende « Genève », carte « Visite du
// site 1/3 ») est dessiné par l'ancre (components/three) ; la page ne pose que la bulle.
export function HeroStage({ className }: { className?: string }) {
  const t = useTranslations("pro");
  const tCommon = useTranslations("common");

  return (
    <aside aria-label={tCommon("avatar.guideLabel")} className={cx(styles.stage, className)}>
      <AvatarAnchor
        variant="hero"
        label={tCommon("avatar.label", { name: profile.firstName })}
        fit="fill"
        className={styles.anchor}
      >
        {/* Mobile / tablette : queue au-dessus de la tête de Rominou (même axe : 55 %, cf. CSS) */}
        <SpeechBubble
          tail="bottom"
          tailOffset="55%"
          tailLg="right"
          tailOffsetLg="5.25rem"
          className={styles.bubble}
        >
          {t("guide.bubble", { name: profile.firstName })}
        </SpeechBubble>
      </AvatarAnchor>
    </aside>
  );
}
