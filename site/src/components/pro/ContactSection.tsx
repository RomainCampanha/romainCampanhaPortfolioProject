import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile } from "@/content/profile";
import { inSentence } from "@/lib/text";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Button, ClayCard, RominouHead, SpeechBubble } from "@/components/ui";
import styles from "./ContactSection.module.css";

// #contact : e-mail, LinkedIn, Instagram, + le coin de Rominou qui renvoie vers le chat.
export function ContactSection() {
  const t = useTranslations("pro.contact");
  const locale = useLocale() as AppLocale;
  const { email, linkedin, instagram } = profile.links;
  // « parler rap français et voyages » : deux passions du profil (musique, voyages)
  const hobby = (id: string) => profile.hobbies.find((h) => h.id === id);
  const music = hobby("music");
  const travel = hobby("travel");

  return (
    <section id="contact" aria-labelledby="contact-title" className={styles.section}>
      <ClayCard className={styles.card}>
        <div className={styles.main}>
          <SectionHeading
            id="contact-title"
            kicker={t("kicker")}
            kickerIcon="mail"
            title={t("title")}
            intro={t("intro", {
              music: music ? inSentence(pick(music.label, locale), locale) : "",
              travel: travel ? inSentence(pick(travel.label, locale), locale) : "",
            })}
            className="mb-7! sm:mb-8!"
          />
          <ul aria-label={t("linksLabel")} className={styles.links}>
            <li>
              <Button icon="mail" href={`mailto:${email}`}>
                {t("email")}
              </Button>
            </li>
            <li>
              <Button variant="secondary" iconEnd="arrow-up-right" href={linkedin}>
                {t("linkedin")}
              </Button>
            </li>
            <li>
              <Button variant="secondary" iconEnd="arrow-up-right" href={instagram}>
                {t("instagram")}
              </Button>
            </li>
          </ul>
          <p className={styles.address}>
            {t("emailDirect")} <span className={styles.email}>{email}</span>
          </p>
        </div>

        {/* Le coin de Rominou : direction le chat */}
        <ClayCard tone="lilac" radius="lg" depth="sm" className={styles.chat}>
          <RominouHead size={72} ring="theme" className={styles.head} />
          <SpeechBubble name={null} size="sm" tail="left" tailOffset="50%" tailLg="top" tailOffsetLg="50%" className={styles.bubble}>
            {t("chatHint", { name: profile.firstName })}
          </SpeechBubble>
          <Button variant="secondary" size="sm" icon="chat" href="/chat" className={styles.chatButton}>
            {t("chatCta")}
          </Button>
        </ClayCard>
      </ClayCard>
    </section>
  );
}
