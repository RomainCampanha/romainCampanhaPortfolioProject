import type { AppLocale } from "@/i18n/routing";
import { pick, profile } from "@/content/profile";
import { SITE_URL, localizedPath } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";

// JSON-LD schema.org "Person" de la page Pro. Volontairement sans date de naissance.
export function PersonJsonLd({ locale }: { locale: AppLocale }) {
  const { work, links } = profile;
  const obtained = profile.education.filter((e) => e.status === "obtained");

  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: profile.name,
    givenName: profile.firstName,
    familyName: profile.lastName,
    url: `${SITE_URL}${localizedPath(locale, "/")}`,
    description: pick(profile.headline, locale),
    jobTitle: pick(work.role, locale),
    worksFor: { "@type": "Organization", name: work.company, url: work.url },
    alumniOf: obtained.map((e) => ({
      "@type": "EducationalOrganization",
      name: pick(e.school.name, locale),
      alternateName: e.school.shortName,
      address: { "@type": "PostalAddress", addressLocality: pick(e.school.city, locale), addressCountry: "CH" },
    })),
    homeLocation: {
      "@type": "Place",
      name: pick(profile.location, locale),
      address: { "@type": "PostalAddress", addressLocality: pick(profile.location, locale), addressCountry: "CH" },
    },
    email: `mailto:${links.email}`,
    sameAs: [links.linkedin, links.instagram, ...(links.github ? [links.github] : [])],
    knowsAbout: profile.skillGroups.flatMap((g) => g.skills),
    knowsLanguage: profile.languages.map((l) => l.name.en),
  };

  return <JsonLd data={data} />;
}
