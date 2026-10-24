// Données structurées schema.org (balise <script> native, recommandée par Next.js).
// "<" est échappé pour empêcher toute fermeture prématurée de la balise (XSS).
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
