"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { pageFromPathname } from "@/lib/pages";
import { avatarStore } from "@/lib/avatar/store";

// Racine thémée du site : data-theme suit l'URL (header, footer et fond inclus)
// et synchronise la page courante dans le store de l'avatar.
export function PageThemeRoot({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const page = pageFromPathname(pathname) ?? "pro";

  useEffect(() => {
    avatarStore.setPage(page);
  }, [page]);

  return (
    <div data-theme={page} className="theme-root">
      {children}
    </div>
  );
}
