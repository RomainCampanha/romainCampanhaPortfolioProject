import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { pick, profile } from "@/content/profile";
import { ExternalLink } from "@/components/site/ExternalLink";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ArrowIcon } from "./icons";

// #projets : aujourd'hui GE-Soif, projet d'école du CFPT (pas un projet perso).
// Tout vient de profile.ts : capture, points clés, stack et lien "Visiter" ne sont
// affichés que s'ils sont renseignés (rien d'inventé, pas de lien mort).
export function ProjectSection() {
  const t = useTranslations("pro.project");
  const locale = useLocale();

  return (
    <section id="projets" aria-labelledby="projets-title" className="scroll-mt-20 py-12 sm:py-16">
      <SectionHeading id="projets-title" title={t("title", { count: profile.projects.length })} />

      <ul className="grid gap-6">
        {profile.projects.map((project) => {
          const host = project.url ? new URL(project.url).hostname : null;
          const context = [pick(project.context, locale), project.year ? String(project.year) : null]
            .filter(Boolean)
            .join(" · ");

          return (
            <li key={project.id}>
              <article
                aria-labelledby={`project-${project.id}`}
                className="overflow-hidden rounded-card border border-line bg-surface"
              >
                <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                  {project.image ? (
                    <div className="border-b border-line bg-night/40 p-3 sm:p-4 md:border-b-0 md:border-r">
                      {/* Mini fenêtre de navigateur autour de la capture */}
                      <figure className="overflow-hidden rounded-xl border border-line bg-night shadow-glow">
                        <div aria-hidden="true" className="flex items-center gap-1.5 border-b border-line px-3 py-2">
                          <span className="size-2 rounded-full bg-white/25" />
                          <span className="size-2 rounded-full bg-white/25" />
                          <span className="size-2 rounded-full bg-white/25" />
                          {host ? <span className="ml-2 truncate text-xs text-muted">{host}</span> : null}
                        </div>
                        <Image
                          src={project.image.src}
                          alt={pick(project.image.alt, locale)}
                          width={project.image.width}
                          height={project.image.height}
                          // Capture déjà optimisée (WebP 1280 px, ~60 Ko) : servie telle quelle
                          unoptimized
                          className="h-auto w-full"
                        />
                      </figure>
                    </div>
                  ) : null}

                  <div className="flex flex-col p-5 sm:p-7">
                    <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {t(`kind.${project.kind}`)}
                    </p>
                    <h3 id={`project-${project.id}`} className="mt-2 font-display text-2xl font-bold">
                      {project.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-muted">{context}</p>
                    <p className="mt-3 text-lg">{pick(project.description, locale)}</p>
                    {project.url && host ? (
                      <div className="mt-6">
                        <ExternalLink href={project.url} className="btn-neon">
                          {t("visit", { name: host })}
                          <ArrowIcon direction="up-right" />
                        </ExternalLink>
                      </div>
                    ) : null}
                  </div>
                </div>

                {project.pitch || project.highlights.length > 0 || project.stack.length > 0 ? (
                  <div className="border-t border-line p-5 sm:p-7">
                    {project.pitch ? <p className="text-muted">{pick(project.pitch, locale)}</p> : null}
                    {project.highlights.length > 0 ? (
                      <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                        {project.highlights.map((highlight) => (
                          <li key={highlight.en} className="flex gap-2.5">
                            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                            <span>{pick(highlight, locale)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {project.stack.length > 0 ? (
                      <ul className="mt-4 flex flex-wrap gap-2 text-sm">
                        {project.stack.map((tech) => (
                          <li key={tech} className="rounded-full border border-line px-3 py-1">
                            {tech}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
