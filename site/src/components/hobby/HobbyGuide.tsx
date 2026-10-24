import { useTranslations } from "next-intl";
import { profile } from "@/content/profile";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { AvatarAnchor } from "@/components/three/AvatarAnchor";
import styles from "./HobbyPage.module.css";

// Rominou, le guide, en tenue de vacances (landmark complementary) : sa boîte de dialogue
// + l'ancre de l'avatar 3D (UNE seule ancre sur la page ; même cadrage plein pied partout,
// seule la taille change en CSS). Mobile : bulle à gauche, Rominou à droite ; 64rem+ : bulle
// au-dessus ; 80rem+ : colonne collante à droite des cartes.
export function HobbyGuide({ className }: { className?: string }) {
  const t = useTranslations("hobby.guide");
  const tAvatar = useTranslations("common.avatar");

  return (
    <aside aria-label={tAvatar("guideLabel")} className={className}>
      <div className={styles.guideRow}>
        <SpeechBubble tail="right" tailLg="bottom" tailOffset="50%" tailOffsetLg="62%" className={styles.bubble}>
          {t("bubble", { name: profile.firstName })}
        </SpeechBubble>
        <div className={styles.stage}>
          <AvatarAnchor variant="column" label={t("label")} className={styles.anchor} />
        </div>
      </div>
    </aside>
  );
}
