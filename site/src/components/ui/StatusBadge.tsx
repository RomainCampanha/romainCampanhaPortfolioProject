import { useTranslations } from "next-intl";
import { cx } from "./cx";
import { Icon } from "./Icon";

/** Mêmes valeurs que Education["status"] dans profile.ts. */
export type Status = "obtained" | "in-progress";

const STATUS_STYLE = {
  obtained: { tone: "sage", icon: "check", key: "obtained" },
  "in-progress": { tone: "butter", icon: "sprout", key: "inProgress" },
} as const;

type StatusBadgeProps = {
  status: Status;
  /** Penché de 6° comme un sticker (défaut true). */
  tilt?: boolean;
  as?: "span" | "p";
  className?: string;
};

/** Badge d'état « Obtenu » (sauge, coche) / « En cours » (beurre, pousse). Libellés : common.status. */
export function StatusBadge({ status, tilt = true, as: Component = "span", className }: StatusBadgeProps) {
  const t = useTranslations("common.status");
  const { tone, icon, key } = STATUS_STYLE[status];
  return (
    <Component className={cx("status-badge", className)} data-tone={tone} data-tilt={tilt}>
      <Icon name={icon} />
      {t(key)}
    </Component>
  );
}
