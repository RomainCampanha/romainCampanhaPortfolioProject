import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { profile } from "@/content/profile";
import { ExternalLink } from "@/components/site/ExternalLink";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ChatIcon, InstagramIcon, LinkedInIcon, MailIcon } from "./icons";

const CHIP =
  "inline-flex items-center gap-2.5 rounded-full border border-line bg-surface px-5 py-3 font-semibold transition-[box-shadow,border-color] hover:border-accent hover:shadow-glow";

// #contact : e-mail, LinkedIn, Instagram (+ renvoi vers le chat).
export function ContactSection() {
  const t = useTranslations("pro.contact");
  const { email, linkedin, instagram } = profile.links;

  const socials: { href: string; label: string; icon: ReactNode }[] = [
    { href: linkedin, label: t("linkedin"), icon: <LinkedInIcon /> },
    { href: instagram, label: t("instagram"), icon: <InstagramIcon /> },
  ];

  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-20 py-12 sm:py-16">
      <div className="rounded-card border border-line bg-linear-to-br from-plum/80 to-night/80 p-6 shadow-glow sm:p-10">
        <SectionHeading id="contact-title" title={t("title")} intro={t("intro")} />

        <ul className="flex flex-wrap gap-3">
          <li>
            <a href={`mailto:${email}`} className={CHIP}>
              <MailIcon />
              <span>
                {t("email")}
                <span className="block text-sm font-normal text-muted">{email}</span>
              </span>
            </a>
          </li>
          {socials.map(({ href, label, icon }) => (
            <li key={href}>
              <ExternalLink href={href} className={CHIP}>
                {icon}
                {label}
              </ExternalLink>
            </li>
          ))}
        </ul>

        <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">
          {t("chatHint")}
          <Link href="/chat" className="inline-flex items-center gap-2 font-semibold text-accent underline underline-offset-4">
            <ChatIcon />
            {t("chatCta")}
          </Link>
        </p>
      </div>
    </section>
  );
}
