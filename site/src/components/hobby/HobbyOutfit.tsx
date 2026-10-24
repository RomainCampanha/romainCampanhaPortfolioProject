"use client";

import { useEffect } from "react";
import { avatarStore } from "@/lib/avatar/store";

// Page Hobby : Rominou passe en tenue de vacances, et revient à la tenue par défaut en partant.
// (setPage() fait déjà suivre la tenue à la page ; ceci rend l'intention explicite et
// garantit le retour à "default" même si une autre page ne change pas la tenue.)
export function HobbyOutfit() {
  useEffect(() => {
    avatarStore.setOutfit("vacances");
    return () => avatarStore.setOutfit("default");
  }, []);
  return null;
}
