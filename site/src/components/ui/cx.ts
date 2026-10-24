/** Joint des classes CSS en ignorant les valeurs vides (petit équivalent de clsx). */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
