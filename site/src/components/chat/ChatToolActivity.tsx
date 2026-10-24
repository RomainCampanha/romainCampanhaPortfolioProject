"use client";

import { useTranslations } from "next-intl";
import type { ChatUIPart } from "@/lib/chat/tools";
import type { TripLabels } from "./types";

type ToolPart = Extract<
  ChatUIPart,
  { type: "tool-navigate" | "tool-playAnimation" | "tool-showTrip" }
>;

type ChatToolActivityProps = { part: ToolPart; tripLabels: TripLabels };

// Ligne discrète décrivant ce que Rominou fait dans le navigateur (outil client).
export function ChatToolActivity({ part, tripLabels }: ChatToolActivityProps) {
  const t = useTranslations("chat.tools");
  const tNav = useTranslations("common.nav");

  if (part.state === "input-streaming") return null;
  if (part.state === "output-error") {
    return <p className="text-sm italic text-muted">{t("failed")}</p>;
  }
  if (part.state !== "input-available" && part.state !== "output-available") return null;

  let label: string;
  switch (part.type) {
    case "tool-navigate":
      label = t("navigate", { page: tNav(part.input.page) });
      break;
    case "tool-showTrip":
      label = t("showTrip", {
        destination: tripLabels[part.input.destination] ?? part.input.destination,
      });
      break;
    case "tool-playAnimation":
      label = t(`playAnimation.${part.input.name}`);
      break;
  }

  return (
    <p className="flex items-center gap-2 text-sm italic text-muted">
      <span aria-hidden="true" className="inline-block size-1.5 shrink-0 rounded-full bg-accent" />
      {label}
    </p>
  );
}
