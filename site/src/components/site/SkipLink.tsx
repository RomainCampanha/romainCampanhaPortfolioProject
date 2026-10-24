import { useTranslations } from "next-intl";

// Lien d'évitement : premier élément focusable, visible au focus clavier.
export function SkipLink() {
  const t = useTranslations("common");
  return (
    <a href="#main" className="skip-link">
      {t("skipLink")}
    </a>
  );
}
