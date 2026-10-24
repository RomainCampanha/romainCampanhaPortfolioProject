import type { AppLocale } from "./routing";

import type frCommon from "../../messages/fr/common.json";
import type frPro from "../../messages/fr/pro.json";
import type frHobby from "../../messages/fr/hobby.json";
import type frChat from "../../messages/fr/chat.json";
import type frTour from "../../messages/fr/tour.json";
import type frGame from "../../messages/fr/game.json";

// Un fichier JSON par namespace et par langue : chaque agent/feature possède le sien.
export const namespaces = ["common", "pro", "hobby", "chat", "tour", "game"] as const;
export type Namespace = (typeof namespaces)[number];

// Le français fait foi pour le typage des clés (voir src/types/next-intl.d.ts).
export type Messages = {
  common: typeof frCommon;
  pro: typeof frPro;
  hobby: typeof frHobby;
  chat: typeof frChat;
  tour: typeof frTour;
  game: typeof frGame;
};

/** Charge et fusionne les namespaces d'une langue. */
export async function loadMessages(locale: AppLocale): Promise<Messages> {
  const [common, pro, hobby, chat, tour, game] = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/pro.json`),
    import(`../../messages/${locale}/hobby.json`),
    import(`../../messages/${locale}/chat.json`),
    import(`../../messages/${locale}/tour.json`),
    import(`../../messages/${locale}/game.json`),
  ]);

  return {
    common: common.default,
    pro: pro.default,
    hobby: hobby.default,
    chat: chat.default,
    tour: tour.default,
    game: game.default,
  };
}
