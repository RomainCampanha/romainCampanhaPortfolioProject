import type { AvatarAnchorVariant } from "@/lib/avatar/store";
import { ResponsiveAvatarAnchor } from "./ResponsiveAvatarAnchor";
import styles from "./RominouGuide.module.css";

type RominouGuideProps = {
  /** Texte alternatif de l'avatar (ex. "Rominou, l'avatar 3D de Romain"). */
  label: string;
  /** Ce que Rominou "dit" dans sa bulle. */
  message: string;
  mobile?: AvatarAnchorVariant;
  desktop?: AvatarAnchorVariant;
};

// Rominou + sa bulle : côte à côte sur mobile, bulle au-dessus de l'avatar à partir de lg.
// Phase 2 : la bulle deviendra le texte animé de la visite guidée.
export function RominouGuide({ label, message, mobile, desktop }: RominouGuideProps) {
  return (
    <div className={styles.guide}>
      <p className={styles.bubble}>{message}</p>
      <ResponsiveAvatarAnchor
        mobile={mobile}
        desktop={desktop}
        label={label}
        className={styles.anchor}
      />
    </div>
  );
}
