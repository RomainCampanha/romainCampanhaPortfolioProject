import { useLocale, useTranslations } from "next-intl";
import { pick, profile } from "@/content/profile";
import { ExternalLink } from "@/components/site/ExternalLink";
import { SectionHeading } from "@/components/site/SectionHeading";
import { GesoifIllustration } from "./GesoifIllustration";
import { ArrowIcon } from "./icons";

// #projets : projets perso (aujourd'hui gesoif.ch). La stack, l'idée et le lien "Visiter"
// ne sont affichés que s'ils sont renseignés dans profile.ts (rien d'inventé ; url null =
// site pas encore en ligne, donc pas de lien mort).
export function ProjectSection() {
  const t = useTranslations("pro.project");
  const locale = useLocale();

  return (
    <section id="projets" aria-labelledby="projets-title" className="scroll-mt-20 py-12 sm:py-16">
      <SectionHeading id="projets-title" title={t("title")} />

      <ul className="grid gap-6">
        {profile.projects.map((project) => (
          <li key={project.id}>
            <article
              aria-labelledby={`project-${project.id}`}
              className="grid overflow-hidden rounded-card border border-line bg-surface md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
            >
              <div className="aspect-[16/10] border-b border-line md:aspect-auto md:min-h-64 md:border-b-0 md:border-r">
                {project.id === "gesoif" ? <GesoifIllustration /> : null}
              </div>
              <div className="flex flex-col p-5 sm:p-7">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  {t("kicker")}
                </p>
                <h3 id={`project-${project.id}`} className="mt-2 font-display text-2xl font-bold">
                  {project.name}
                </h3>
                <p className="mt-3 text-lg">{pick(project.description, locale)}</p>
                {project.pitch ? <p className="mt-2 text-muted">{pick(project.pitch, locale)}</p> : null}
                {project.stack.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2 text-sm">
                    {project.stack.map((tech) => (
                      <li key={tech} className="rounded-full border border-line px-3 py-1">
                        {tech}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {project.url ? (
                  <div className="mt-6">
                    <ExternalLink href={project.url} className="btn-neon">
                      {t("visit", { name: project.name })}
                      <ArrowIcon direction="up-right" />
                    </ExternalLink>
                  </div>
                ) : null}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
