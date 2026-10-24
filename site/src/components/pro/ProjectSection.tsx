import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { pick, profile } from "@/content/profile";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Button, Chip, ClayCard, Icon, Sticker, WavyBand } from "@/components/ui";
import styles from "./ProjectSection.module.css";

// #projets : aujourd'hui GE-Soif, projet d'école du CFPT (pas un projet perso), dans une bande
// pleine largeur à bords ondulés (avoine foncé, la bande du thème Pro) : elle rythme la page.
// Tout vient de profile.ts : capture, points clés, stack et lien « Visiter » ne sont
// affichés que s'ils sont renseignés (rien d'inventé, pas de lien mort).
export function ProjectSection() {
  const t = useTranslations("pro.project");
  const locale = useLocale() as AppLocale;
  const { projects } = profile;
  if (projects.length === 0) return null;

  return (
    <WavyBand edges="both" id="projets" aria-labelledby="projets-title" className={styles.section}>
      <div className="site-container">
        <SectionHeading
          id="projets-title"
          kicker={t("kicker", { count: projects.length })}
          kickerIcon="code"
          title={t("title")}
        />

        <ul className={styles.list}>
          {projects.map((project) => {
            const host = project.url ? new URL(project.url).hostname : null;
            const context = [pick(project.context, locale), project.year ? String(project.year) : null]
              .filter(Boolean)
              .join(" · ");

            return (
              <li key={project.id}>
                <ClayCard
                  as="article"
                  aria-labelledby={`project-${project.id}`}
                  className={styles.card}
                  data-has-image={project.image ? true : undefined}
                >
                  {project.image ? (
                    <div className={styles.desk}>
                      {/* Capture dans une fenêtre de navigateur en argile */}
                      <figure className={styles.browser}>
                        <div aria-hidden="true" className={styles.browserBar}>
                          <span className={styles.browserDots}>
                            <span />
                            <span />
                            <span />
                          </span>
                          {host ? (
                            <span className={styles.browserUrl}>
                              <Icon name="globe" size={14} />
                              {host}
                            </span>
                          ) : null}
                        </div>
                        <Image
                          src={project.image.src}
                          alt={pick(project.image.alt, locale)}
                          width={project.image.width}
                          height={project.image.height}
                          // Capture déjà optimisée (WebP 1280 px, ~60 Ko) : servie telle quelle
                          unoptimized
                          className={styles.shot}
                        />
                      </figure>
                    </div>
                  ) : null}

                  <div className={styles.body}>
                    <Sticker as="p" tone={project.kind === "school" ? "lilac" : "butter"} icon={project.kind === "school" ? "graduation" : "sparkle"}>
                      {t(`kind.${project.kind}`)}
                    </Sticker>
                    <h3 id={`project-${project.id}`} className={`type-h3 ${styles.title}`}>
                      {project.name}
                    </h3>
                    <p className={styles.context}>{context}</p>
                    <p className={styles.description}>{pick(project.description, locale)}</p>
                    {project.pitch ? <p className={styles.pitch}>{pick(project.pitch, locale)}</p> : null}

                    {project.highlights.length > 0 ? (
                      <ul aria-label={t("highlightsLabel", { name: project.name })} className={styles.highlights}>
                        {project.highlights.map((highlight) => (
                          <li key={highlight.en}>
                            <span aria-hidden="true" className={styles.check}>
                              <Icon name="check" size={14} />
                            </span>
                            <span>{pick(highlight, locale)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {project.stack.length > 0 ? (
                      <ul aria-label={t("stackLabel")} className={styles.stack}>
                        {project.stack.map((tech) => (
                          <Chip as="li" key={tech}>
                            {tech}
                          </Chip>
                        ))}
                      </ul>
                    ) : null}

                    {project.url && host ? (
                      <div className={styles.actions}>
                        <Button href={project.url} iconEnd="arrow-up-right">
                          {t("visit", { name: host })}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </ClayCard>
              </li>
            );
          })}
        </ul>
      </div>
    </WavyBand>
  );
}
