import { notFound } from "next/navigation";

// Attrape toutes les URLs inconnues sous [locale] pour afficher la 404 localisée.
// Le layout [locale] fixe dynamicParams = false : on le réautorise ici.
export const dynamicParams = true;

export default function CatchAllPage() {
  notFound();
}
