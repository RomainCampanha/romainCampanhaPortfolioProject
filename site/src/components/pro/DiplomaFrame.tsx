import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { pick, type Education } from "@/content/profile";
import { SCHOOL_LOGOS } from "./assets";

type DiplomaFrameProps = {
  education: Education;
  /** Légère inclinaison (classe Tailwind) : effet "cadre accroché au mur". */
  tiltClassName?: string;
};

// Un diplôme du mur : cadre néon, logo de l'école, tampon "Obtenu" / "En cours".
export function DiplomaFrame({ education: e, tiltClassName = "" }: DiplomaFrameProps) {
  const t = useTranslations("pro.path");
  const locale = useLocale();
  const titleId = `diploma-${e.id}`;
  // Années passées en texte : un nombre serait formaté "2 017" par ICU.
  const period =
    e.endYear !== null
      ? t("period", { start: String(e.startYear), end: String(e.endYear) })
      : t("since", { start: String(e.startYear) });

  return (
    <article
      aria-labelledby={titleId}
      className={`relative h-full motion-safe:transition-transform motion-safe:duration-300 hover:rotate-0 ${tiltClassName}`}
    >
      {/* Le clou du cadre */}
      <span
        aria-hidden="true"
        className="absolute -top-2 left-1/2 z-10 size-3.5 -translate-x-1/2 rounded-full bg-linear-to-br from-white to-muted shadow-[0_2px_4px_rgb(0_0_0/0.5)]"
      />
      <div className="h-full rounded-card bg-linear-to-br from-cyan via-accent-2 to-plum p-[3px] shadow-glow">
        <div className="flex h-full flex-col rounded-[calc(var(--radius-card)-3px)] bg-night/90 p-5">
          <div className="flex items-start justify-between gap-3">
            <SchoolMark logo={SCHOOL_LOGOS[e.id] ?? null} shortName={e.school.shortName} />
            <StatusStamp obtained={e.status === "obtained"} label={t(e.status === "obtained" ? "status.obtained" : "status.inProgress")} />
          </div>

          <p className="mt-5 font-display text-xs font-semibold tracking-widest text-accent">{period}</p>
          <h4 id={titleId} className="mt-1 font-display text-base font-bold leading-snug">
            {pick(e.title, locale)}
          </h4>
          <p className="mt-2 text-sm text-muted">
            <span className="font-semibold text-fg">{e.school.shortName}</span>
            {" · "}
            {pick(e.school.name, locale)}
          </p>
          {e.nickname ? (
            <p className="mt-2 text-sm italic text-muted">
              {t("nickname", { nickname: pick(e.nickname, locale) })}
            </p>
          ) : null}
          {e.details ? <p className="mt-2 text-sm">{pick(e.details, locale)}</p> : null}
        </div>
      </div>
    </article>
  );
}

/** Logo de l'école (décoratif : le nom est écrit à côté) ou monogramme. */
function SchoolMark({ logo, shortName }: { logo: string | null; shortName: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1"
    >
      {logo ? (
        <Image src={logo} alt="" width={40} height={40} unoptimized className="size-10 object-contain" />
      ) : (
        <span className="font-display text-xs font-black text-night">{shortName.split(" ")[0]}</span>
      )}
    </span>
  );
}

/** Tampon encreur : double bordure pleine si obtenu, pointillés si en cours. */
function StatusStamp({ obtained, label }: { obtained: boolean; label: string }) {
  return (
    <span
      className={[
        "-rotate-[8deg] whitespace-nowrap rounded-md px-2 py-1 font-display text-[0.7rem] font-black uppercase tracking-[0.18em]",
        obtained
          ? "border-[3px] border-double border-cyan text-cyan [text-shadow:0_0_8px_rgb(0_193_255/0.6)]"
          : "border-2 border-dashed border-accent-2 text-accent-2",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
