"use client";

import { useAvatar } from "@/lib/avatar/store";
import styles from "./AvatarAnchor.module.css";

// Petite bulle « … » à côté de Rominou (décor du chat) : visible pendant qu'il écrit sa
// réponse (store : speaking). Décorative : la conversation elle-même est annoncée par le chat.
export function TypingBubble() {
  const speaking = useAvatar((s) => s.speaking);
  return (
    <span aria-hidden="true" className={styles.typing} data-visible={speaking}>
      <i />
      <i />
      <i />
    </span>
  );
}
