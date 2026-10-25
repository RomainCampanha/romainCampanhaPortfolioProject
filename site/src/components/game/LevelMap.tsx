"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import type { LevelCard } from "@/lib/game/catalog";
import type { SaveData } from "@/lib/game/storage";
import { Icon } from "@/components/ui/Icon";
import { RominouHead } from "@/components/ui/RominouHead";
import styles from "./game.module.css";

type LevelMapProps = {
  levels: LevelCard[];
  unlocked: number;
  selected: number;
  save: SaveData;
  onSelect: (index: number) => void;
};

/**
 * Carte du voyage : Genève -> … -> Busan, une étape par niveau (plateau de jeu cosy).
 * Étapes débloquées = boutons (aria-pressed = sélection) ; verrouillées = aria-disabled
 * (restent annoncées et atteignables au clavier, sans effet).
 */
export function LevelMap({ levels, unlocked, selected, save, onSelect }: LevelMapProps) {
  const t = useTranslations("game.map");
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={styles.map}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 id={titleId} className="type-kicker text-accent">
          {t("title")}
        </h4>
        <p className="text-sm font-bold text-muted">{t("intro")}</p>
      </div>
      <ol className={styles.mapList}>
        {levels.map((level, index) => {
          const locked = index > unlocked;
          const done = save.postcards.includes(level.id);
          const isSelected = index === selected;
          const step = index === 0 ? t("start") : t("level", { n: index });
          const state = locked ? t("locked") : done ? t("done") : t("open");
          const best = save.best[level.id];
          return (
            <li key={level.id} className={styles.mapItem} data-tone={level.tone}>
              <button
                type="button"
                className={styles.mapNode}
                aria-label={[
                  t("nodeLabel", { step, name: level.name, year: level.year ? ` (${level.year})` : "", state }),
                  isSelected ? t("selected") : null,
                ]
                  .filter(Boolean)
                  .join(", ")
                  .concat(best !== undefined ? `. ${t("best", { count: best })}` : "")}
                aria-pressed={isSelected}
                aria-disabled={locked || undefined}
                data-state={locked ? "locked" : done ? "done" : "open"}
                onClick={() => {
                  if (!locked) onSelect(index);
                }}
              >
                <span aria-hidden="true" className={styles.mapPin}>
                  {isSelected ? (
                    <RominouHead size={40} className={styles.mapHead} />
                  ) : locked ? (
                    <Icon name="lock" size={18} />
                  ) : done ? (
                    <Icon name="check" size={20} />
                  ) : (
                    <span className="font-black">{index === 0 ? <Icon name="pin" size={18} /> : index}</span>
                  )}
                </span>
                <span aria-hidden="true" className={styles.mapLabel}>
                  <span className={styles.mapName}>{level.name}</span>
                  <span className={styles.mapYear}>{level.year ?? t("start")}</span>
                </span>
              </button>
              {done && isSelected ? (
                <span aria-hidden="true" className={styles.mapStamp}>
                  <Icon name="check" size={12} />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
