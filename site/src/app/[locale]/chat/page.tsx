import type { Metadata } from "next";
import { NextIntlClientProvider, useMessages, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import type { AppLocale } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";
import { pick, profile } from "@/content/profile";
import { PageShell } from "@/components/site/PageShell";
import { SectionKicker } from "@/components/ui/SectionKicker";
import { AvatarAnchor } from "@/components/three/AvatarAnchor";
import { ChatExperience } from "@/components/chat/ChatExperience";
import { EmailLink } from "@/components/chat/EmailLink";
import type { TripLabels } from "@/components/chat/types";
import styles from "@/components/chat/Chat.module.css";

// Page Chat : discuter avec "la version IA de Romain" (Rominou), qui peut aussi
// naviguer sur le site et animer l'avatar (outils exécutés dans le navigateur).
// Bande lilas : à gauche le titre, l'avertissement IA et le cadre de Rominou ; à droite
// la fenêtre de chat (sur mobile : juste sous le texte, Rominou après).

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
  const tAvatar = useTranslations("common.avatar");
  // Traductions envoyées au navigateur pour l'interface du chat (+ noms des pages,
  // pour "Direction la page Hobby").
  const { chat, common } = useMessages();
  const email = profile.links.email;

  return (
    <PageShell theme="chat" className="pb-6 pt-6 sm:pt-12 lg:pb-10 lg:pt-12">
      {/* Grille (Chat.module.css) : mobile = texte, fenêtre de chat, avertissement IA, puis
          Rominou (la saisie arrive vite à l'écran) ; tablette = texte | Rominou, chat dessous ;
          desktop = texte, avertissement et Rominou à gauche, chat à droite. */}
      <section aria-labelledby="chat-title" className={styles.layout}>
        <div className={styles.intro}>
          <SectionKicker icon="chat">{t("hero.kicker")}</SectionKicker>
          <h1 id="chat-title" className="type-h2 mt-3.5">
            {t("hero.title", { name: profile.firstName })}
          </h1>
          <p className="mt-4 max-w-[56ch] text-[1.0625rem] font-semibold text-pretty text-muted sm:text-lg">
            {t("hero.intro", { name: profile.firstName })}
          </p>
        </div>

        <div className={styles.windowSlot}>
          <NextIntlClientProvider messages={{ chat, common: { nav: common.nav } }}>
            <ChatExperience
              tripLabels={tripLabels(locale as AppLocale)}
              email={email}
              name={profile.firstName}
              company={profile.work.company}
            />
          </NextIntlClientProvider>
        </div>

        {/* Avertissement IA : sous la fenêtre sur mobile et tablette (comme sous une saisie de
            chat), sous le texte à gauche sur desktop */}
        <p role="note" className={styles.notice}>
          {t.rich("notice", { email, link: () => <EmailLink email={email} unbroken /> })}
        </p>

        {/* Cadre de Rominou (buste) : décor posé par l'ancre « chat » */}
        <AvatarAnchor variant="chat" label={tAvatar("label", { name: profile.firstName })} className={styles.guide} />
      </section>
    </PageShell>
  );
}
