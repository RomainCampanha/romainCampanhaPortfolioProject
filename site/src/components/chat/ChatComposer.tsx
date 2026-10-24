"use client";

import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type Ref,
} from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { CHAT_LIMITS } from "@/lib/chat/constants";
import styles from "./Chat.module.css";

type ChatComposerProps = {
  ref?: Ref<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  /** Une réponse est en cours : envoi bloqué, bouton Arrêter à la place d'Envoyer. */
  busy: boolean;
};

const MAX = CHAT_LIMITS.maxTextPartChars;
/** Le compteur devient visible à partir de 80 % de la limite (toujours lu par les lecteurs d'écran). */
const COUNTER_VISIBLE_FROM = Math.round(MAX * 0.8);

// Saisie en pilule : champ étiqueté qui grandit avec le texte (500 caractères max, compteur),
// bouton rond Envoyer (argile) ou Arrêter (crème) pendant une réponse.
export function ChatComposer({ ref, value, onChange, onSubmit, onStop, busy }: ChatComposerProps) {
  const t = useTranslations("chat.composer");
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const canSend = !busy && value.trim().length > 0;

  // Le parent garde l'accès au champ (focus après envoi / arrêt)
  useImperativeHandle(ref, () => fieldRef.current as HTMLTextAreaElement, []);

  // Hauteur ajustée au contenu (plafonnée en CSS, puis défilement) ; au-delà d'une ligne,
  // la pilule s'arrondit moins (data-multiline, sans re-rendu)
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
    const pill = field.parentElement;
    // Une ligne = 3rem (48 px) : au-delà, le champ a grandi
    if (pill) pill.dataset.multiline = String(field.offsetHeight > 56);
  }, [value]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSend) onSubmit();
  }

  // Clic sur Envoyer / Arrêter pendant la saisie : le champ garde le focus (le clavier mobile
  // reste ouvert et le dock, masqué pendant la saisie, ne réapparaît pas sous le doigt)
  function keepFieldFocus(event: MouseEvent<HTMLButtonElement>) {
    if (document.activeElement === fieldRef.current) event.preventDefault();
  }

  // Entrée = envoyer ; Maj+Entrée = nouvelle ligne (pas pendant une composition IME)
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label htmlFor="chat-input" className="sr-only">
        {t("label")}
      </label>
      <div className={styles.composer}>
        <textarea
          ref={fieldRef}
          id="chat-input"
          name="message"
          rows={1}
          maxLength={MAX}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          aria-describedby="chat-input-hint chat-input-counter"
          autoComplete="off"
          enterKeyHint="send"
          className={styles.input}
        />
        {busy ? (
          <Button
            variant="secondary"
            size="icon"
            icon="stop"
            onClick={onStop}
            onMouseDown={keepFieldFocus}
            aria-label={t("stop")}
            title={t("stop")}
            className={styles.stop}
          />
        ) : (
          <Button
            type="submit"
            size="icon"
            icon="send"
            disabled={!canSend}
            onMouseDown={keepFieldFocus}
            aria-label={t("send")}
            title={t("send")}
          />
        )}
      </div>
      <div className={styles.meta}>
        <p id="chat-input-hint" className="max-sm:sr-only">
          {t("hint")}
        </p>
        <p
          id="chat-input-counter"
          className={`${styles.counter} ${value.length < COUNTER_VISIBLE_FROM ? "sr-only" : ""}`}
          data-full={value.length >= MAX}
        >
          {t("counter", { count: value.length, max: MAX })}
        </p>
      </div>
    </form>
  );
}
