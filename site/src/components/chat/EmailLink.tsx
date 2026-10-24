/**
 * Lien mailto. Par défaut, l'adresse peut passer à la ligne juste avant « @ » (écrans étroits,
 * ex. message d'erreur dans la fenêtre de chat) plutôt qu'au milieu d'un mot ; `unbroken` :
 * adresse d'un seul tenant (là où elle tient sur une ligne dès 320 px). Serveur et client.
 */
export function EmailLink({ email, unbroken = false, className }: { email: string; unbroken?: boolean; className?: string }) {
  const at = email.indexOf("@");
  return (
    <a href={`mailto:${email}`} className={className}>
      {at > 0 && !unbroken ? (
        <>
          {email.slice(0, at)}
          <wbr />
          {email.slice(at)}
        </>
      ) : (
        email
      )}
    </a>
  );
}
