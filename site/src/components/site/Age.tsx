"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { ageInGeneva } from "@/lib/age";

// Âge affiché sur une page statique : celui du build pendant le rendu serveur et
// l'hydratation, puis recalculé dans le navigateur (juste même après un anniversaire).
const subscribe = () => () => {};

export function Age({ birthDate, buildAge }: { birthDate: string; buildAge: number }) {
  const t = useTranslations("common");
  const age = useSyncExternalStore(
    subscribe,
    () => ageInGeneva(birthDate),
    () => buildAge,
  );
  return <>{t("age", { age })}</>;
}
