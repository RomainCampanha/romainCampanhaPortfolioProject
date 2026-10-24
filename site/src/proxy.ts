import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next 16 : "proxy" remplace "middleware". Gère la négociation de langue
// et la réécriture / -> /fr (préfixe masqué pour la langue par défaut).
export default createMiddleware(routing);

export const config = {
  // Exclut : API, internes Next/Vercel, chemins BotID, fichiers avec extension.
  matcher:
    "/((?!api|trpc|_next|_vercel|149e9513-01fa-4fb0-aad4-566afd725d1b|.*\\..*).*)",
};
