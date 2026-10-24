import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/content/profile";
import "./globals.css";

// 404 globale (URLs hors [locale], ex. /fichier.txt) : rendue sans layout,
// donc bilingue et autonome (styles importés ici).
export const metadata: Metadata = {
  title: `404 · ${profile.name}`,
  description: "Page introuvable / Page not found",
};

export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body>
        <div data-theme="pro" className="theme-root">
          <main id="main" className="site-main">
            <div className="page-shell py-20 text-center">
              <p className="font-display text-6xl font-bold text-accent text-shadow-neon">404</p>
              <h1 className="mt-4 font-display text-3xl font-semibold">Page introuvable</h1>
              <p lang="en" className="mt-2 text-xl text-muted">
                Page not found
              </p>
              <p className="mt-8 flex justify-center gap-4">
                {/* next/link (pas le Link localisé) : rendu hors de [locale] */}
                <Link href="/" className="btn-neon">
                  Accueil
                </Link>
                <Link href="/en" lang="en" className="btn-neon">
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
