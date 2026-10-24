// URL publique du site (sans slash final). Module sans dépendance : importable partout.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://romaincampanha.ch"
).replace(/\/$/, "");
