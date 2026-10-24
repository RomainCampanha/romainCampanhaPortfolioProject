/** Âge en années révolues à la date `at`, pour une date de naissance "YYYY-MM-DD". */
export function computeAge(birthDate: string, at: Date): number {
  const [year, month, day] = birthDate.split("-").map(Number);
  let age = at.getFullYear() - year;
  const beforeBirthday =
    at.getMonth() + 1 < month ||
    (at.getMonth() + 1 === month && at.getDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}

/** Date du jour à Genève, format AAAA-MM-JJ. */
export function genevaDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" }).format(now);
}

/** Âge selon le calendrier genevois (midi UTC : aucun effet du fuseau du serveur). */
export function ageInGeneva(birthDate: string, now: Date = new Date()): number {
  return computeAge(birthDate, new Date(`${genevaDate(now)}T12:00:00Z`));
}
