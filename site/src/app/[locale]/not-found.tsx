import { useTranslations } from "next-intl";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/Button";
import { RominouHead } from "@/components/ui/RominouHead";
import { Sticker } from "@/components/ui/Sticker";

// 404 localisée (déclenchée par notFound() sous [locale], ex. via [...rest]).
export default function LocaleNotFound() {
  const t = useTranslations("common.notFound");

  return (
    <PageShell theme="pro">
      <section aria-labelledby="not-found-title" className="flex flex-col items-center py-16 text-center sm:py-24">
        <RominouHead size={96} ring="raised" />
        <Sticker as="p" tone="lilac" icon="pin" tilt={-3} className="mt-8">
          404
        </Sticker>
        <h1 id="not-found-title" className="type-h2 mt-5">
          {t("title")}
        </h1>
        <p className="type-lede mt-4 max-w-[34ch]">{t("description")}</p>
        <Button href="/" icon="briefcase" className="mt-9">
          {t("backHome")}
        </Button>
      </section>
    </PageShell>
  );
}
