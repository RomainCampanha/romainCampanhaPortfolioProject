import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageShell } from "@/components/site/PageShell";

// 404 localisée (déclenchée par notFound() sous [locale], ex. via [...rest]).
export default function LocaleNotFound() {
  const t = useTranslations("common.notFound");

  return (
    <PageShell theme="pro">
      <section aria-labelledby="not-found-title" className="py-20 text-center">
        <p className="font-display text-6xl font-bold text-accent text-shadow-neon">404</p>
        <h1 id="not-found-title" className="mt-4 font-display text-3xl font-semibold">
          {t("title")}
        </h1>
        <p className="mt-4 text-muted">{t("description")}</p>
        <Link href="/" className="btn-neon mt-8">
          {t("backHome")}
        </Link>
      </section>
    </PageShell>
  );
}
