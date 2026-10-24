import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Wrappers localisés autour des APIs de navigation Next.js.
// Toujours importer Link / useRouter / usePathname d'ici (pas de next/link).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
