import type { Metadata } from "next";
import { NextIntlClientProvider, useMessages, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import type { AppLocale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import { pick, profile } from "@/content/profile";
import { PageShell } from "@/components/site/PageShell";
import { AvatarAnchor } from "@/components/three/AvatarAnchor";
import { ChatExperience } from "@/components/chat/ChatExperience";
import type { TripLabels } from "@/components/chat/types";

// Page Chat : discuter avec "la version IA de Romain" (Rominou), qui peut aussi
// naviguer sur le site et animer l'avatar (outils exécutés dans le navigateur).

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/chat">): Promise<Metadata> {
  const locale = (await params).locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "chat.meta" });
  return buildPageMetadata({
    locale,
    path: "/chat",
    title: t("title"),
    description: t("description", { name: profile.name }),
  });
}

/** Libellés des voyages calculés ici : le profil n'est pas embarqué côté client. */
function tripLabels(locale: AppLocale): TripLabels {
  return Object.fromEntries(
    profile.travels.map((trip) => [
      trip.id,
      trip.places.map((place) => pick(place.city, locale)).join(" & "),
    ]),
  );
}

export default function ChatPage({ params }: PageProps<"/[locale]/chat">) {
  const { locale } = use(params);
  setRequestLocale(locale as AppLocale);
  const t = useTranslations("chat");
  // Traductions envoyées au navigateur pour l'interface du chat (+ noms des pages,
  // pour "Rominou t'emmène vers la page Hobby").
  const { chat, common } = useMessages();

  return (
    <PageShell theme="chat">
      <section aria-labelledby="chat-title" className="py-10 sm:py-16">
        <h1 id="chat-title" className="font-display text-4xl font-bold text-shadow-neon sm:text-6xl">
          {t("hero.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{t("hero.intro")}</p>

        {/* Avatar en colonne sur desktop, compact au-dessus du chat sur mobile */}
        <div className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <AvatarAnchor variant="chat" className="h-36 sm:h-48 lg:sticky lg:top-24 lg:h-[28rem]" />
          <NextIntlClientProvider messages={{ chat, common: { nav: common.nav } }}>
            <ChatExperience
              tripLabels={tripLabels(locale as AppLocale)}
              email={profile.links.email}
              company={profile.work.company}
            />
          </NextIntlClientProvider>
        </div>
      </section>
    </PageShell>
  );
}
