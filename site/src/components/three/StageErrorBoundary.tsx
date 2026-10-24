"use client";

import { Component, type ReactNode } from "react";

type Props = { onError: () => void; children: ReactNode };
type State = { failed: boolean };

// Toute erreur 3D (contexte WebGL impossible, GLB introuvable…) => on abandonne la 3D,
// le poster de l'ancre reste affiché. Le reste du site n'est pas affecté.
export class StageErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") console.warn("[avatar] 3D désactivée :", error);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
