import type { Messages } from "@/i18n/messages";
import type { routing } from "@/i18n/routing";

// Typage strict de next-intl : locales et clés de messages (basées sur messages/fr).
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}
