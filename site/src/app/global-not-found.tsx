import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/content/profile";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Icon } from "@/components/ui/Icon";
import { fontVariables } from "./fonts";
import "./globals.css";

// 404 globale (URLs hors [locale], ex. /fichier.txt) : rendue sans layout,
// donc bilingue et autonome (styles importés ici, pas de next-intl).
export const metadata: Metadata = {
  title: `404 · ${profile.name}`,
  description: "Page introuvable / Page not found",
};

export default function GlobalNotFound() {
  return (
    <html lang="fr" className={fontVariables}>
      <body>
        <div data-theme="pro" className="theme-root">
          <main id="main" className="site-main">
            <div className="site-container flex flex-col items-center py-20 text-center sm:py-28">
              <p className="sticker" data-tone="lilac" style={{ rotate: "-3deg" }}>
                <Icon name="pin" />
                404
              </p>
              <h1 className="type-h2 mt-5">Page introuvable</h1>
              <p lang="en" className="type-lede mt-3">
                Page not found
              </p>
              <p className="mt-9 flex flex-wrap justify-center gap-4">
                {/* next/link (pas le Link localisé) : rendu hors de [locale] */}
                <Link href="/" className={buttonClasses()}>
                  Accueil
                </Link>
                <Link href="/en" lang="en" className={buttonClasses({ variant: "secondary" })}>
                  Home
                </Link>
              </p>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
