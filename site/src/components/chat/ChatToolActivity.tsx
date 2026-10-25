"use client";

import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { PageId } from "@/lib/pages";
import type { ChatUIPart } from "@/lib/chat/tools";
import type { TripLabels } from "./types";
import styles from "./Chat.module.css";

export type ChatToolPart = Extract<
  ChatUIPart,
  { type: "tool-navigate" | "tool-playAnimation" | "tool-showTrip" | "tool-startTour" }
>;

/** Partie d'outil client du chat (navigation, animation, voyage). */
export function isChatToolPart(part: ChatUIPart): part is ChatToolPart {
  return (
    part.type === "tool-navigate" ||
    part.type === "tool-playAnimation" ||
    part.type === "tool-showTrip" ||
    part.type === "tool-startTour"
  );
}

/** Mêmes icônes que les onglets du site. */
const PAGE_ICONS: Record<PageId, IconName> = {
  pro: "briefcase",
  hobby: "heart",
  chat: "chat",
};

type ChatToolActivityProps = { part: ChatToolPart; tripLabels: TripLabels };

// Notification « façon jeu » de ce que Rominou fait dans le navigateur (outil client) :
// « Rominou ouvre le voyage : Séoul », « Rominou te fait coucou », « Direction la page Hobby »,
// « Rominou lance la visite du site ».
export function ChatToolActivity({ part, tripLabels }: ChatToolActivityProps) {
  const t = useTranslations("chat.tools");
  const tNav = useTranslations("common.nav");

  if (part.state === "input-streaming") return null;
  if (part.state === "output-error") {
    return (
      <p className={styles.toast} data-state="failed">
        <Icon name="close" />
        {t("failed")}
      </p>
    );
  }
  if (part.state !== "input-available" && part.state !== "output-available") return null;

  let label: string;
  let icon: IconName;
  switch (part.type) {
    case "tool-navigate":
      label = t("navigate", { page: tNav(part.input.page) });
      icon = PAGE_ICONS[part.input.page];
      break;
    case "tool-showTrip":
      label = t("showTrip", {
        destination: tripLabels[part.input.destination] ?? part.input.destination,
      });
      icon = "plane";
      break;
    case "tool-playAnimation":
      label = t(`playAnimation.${part.input.name}`);
      icon = "sparkle";
      break;
    case "tool-startTour":
      label = t("startTour");
      icon = "sparkle";
      break;
  }

  return (
    <p className={styles.toast}>
      <Icon name={icon} />
      {label}
    </p>
  );
}
