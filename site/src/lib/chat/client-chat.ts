import { Chat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type ChatOnToolCallCallback,
  type InferUIMessageChunk,
} from "ai";
import type { AppLocale } from "@/i18n/routing";
import { avatarStore } from "@/lib/avatar/store";
import { PAGE_PATHS } from "@/lib/pages";
import { tourStore } from "@/lib/tour";
import { CHAT_API_PATH, TOOL_ERROR_TEXT } from "./constants";
import { prepareHistory } from "./history";
import type { ChatUIMessage } from "./tools";

// Module client : conversation avec "la version IA de Romain".
// Une seule instance Chat par onglet, gardée au niveau du module : la conversation
// (et un stream en cours) survit aux navigations client entre les pages, comme
// Rominou. Elle repart de zéro au rechargement de la page.

type ChatChunk = InferUIMessageChunk<ChatUIMessage>;
type ChatToolCall = Parameters<ChatOnToolCallCallback<ChatUIMessage>>[0]["toolCall"];

/** Laisse le temps de lire la réponse avant de changer de page. */
const NAVIGATION_DELAY_MS = 700;
/** Étapes max d'une réponse : réponse + 1 relance automatique après un outil. */
const MAX_ASSISTANT_STEPS = 2;

/* ------------------------------------------------------------------ */
/* Pont vers l'UI (routeur localisé, langue)                          */
/* ------------------------------------------------------------------ */

type ChatBridge = { navigate: (href: string) => void; locale: AppLocale };
let bridge: ChatBridge | null = null;
let pendingHref: string | null = null;
/** Visite guidée demandée (outil startTour), lancée à la fin de la réponse. */
let pendingTour = false;

/**
 * Enregistré par l'interface du chat (useRouter de next-intl + useLocale).
 * Sans pont (visiteur parti du chat), les navigations demandées sont ignorées.
 */
export function registerChatBridge(next: ChatBridge): () => void {
  bridge = next;
  return () => {
    if (bridge === next) bridge = null;
  };
}

/* ------------------------------------------------------------------ */
/* Outils exécutés dans le navigateur                                 */
/* ------------------------------------------------------------------ */

const SLUG = /^[a-z0-9-]+$/;

/** Exécute un outil ; retourne false si l'entrée est inattendue. */
function runTool(toolCall: ChatToolCall): boolean {
  if (toolCall.dynamic) return false;
  switch (toolCall.toolName) {
    case "playAnimation":
      avatarStore.play(toolCall.input.name);
      return true;
    case "navigate": {
      const path = PAGE_PATHS[toolCall.input.page];
      if (!path) return false;
      pendingHref = path; // exécuté à la fin de la réponse (cf. onFinish)
      return true;
    }
    case "showTrip":
      if (!SLUG.test(toolCall.input.destination)) return false;
      pendingHref = `${PAGE_PATHS.hobby}#${toolCall.input.destination}`;
      return true;
    case "startTour":
      // La visite navigue elle-même vers sa première étape (page Pro), cf. TourLoader
      pendingTour = true;
      return true;
    default:
      return false;
  }
}

function flushNavigation() {
  const href = pendingHref;
  const tour = pendingTour;
  pendingHref = null;
  pendingTour = false;
  if (tour) window.setTimeout(() => tourStore.start(), NAVIGATION_DELAY_MS);
  else if (href) window.setTimeout(() => bridge?.navigate(href), NAVIGATION_DELAY_MS);
}

/** Abandonne les actions en attente (réponse interrompue ou en erreur). */
function clearPending() {
  pendingHref = null;
  pendingTour = false;
}

/**
 * Relance automatique après un outil client, seulement si Rominou n'a encore
 * rien dit (sinon sa phrase suffit : pas d'appel modèle en plus) et une seule fois.
 */
export function shouldContinueAfterTools({ messages }: { messages: ChatUIMessage[] }): boolean {
  if (!lastAssistantMessageIsCompleteWithToolCalls({ messages })) return false;
  const last = messages.at(-1);
  if (!last) return false;
  const steps = last.parts.filter((p) => p.type === "step-start").length;
  const hasText = last.parts.some((p) => p.type === "text" && p.text.trim() !== "");
  return !hasText && steps < MAX_ASSISTANT_STEPS;
}

/* ------------------------------------------------------------------ */
/* Transport : signal "Rominou parle" pendant le stream de texte      */
/* ------------------------------------------------------------------ */

function speakingSignal(): TransformStream<ChatChunk, ChatChunk> {
  return new TransformStream<ChatChunk, ChatChunk>({
    transform(chunk, controller) {
      if (chunk.type === "text-delta") avatarStore.setSpeaking(true);
      else if (["text-end", "finish", "error", "abort"].includes(chunk.type)) {
        avatarStore.setSpeaking(false);
      }
      controller.enqueue(chunk);
    },
    flush() {
      avatarStore.setSpeaking(false);
    },
  });
}

class RominouTransport extends DefaultChatTransport<ChatUIMessage> {
  protected processResponseStream(
    stream: ReadableStream<Uint8Array<ArrayBufferLike>>,
  ): ReadableStream<ChatChunk> {
    return super.processResponseStream(stream).pipeThrough(speakingSignal());
  }
}

/* ------------------------------------------------------------------ */
/* Instance Chat                                                      */
/* ------------------------------------------------------------------ */

function createChat(): Chat<ChatUIMessage> {
  const chat: Chat<ChatUIMessage> = new Chat<ChatUIMessage>({
    id: "rominou",
    transport: new RominouTransport({
      api: CHAT_API_PATH,
      // Corps minimal et borné (cf. limites de la route)
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          messages: prepareHistory(messages),
          page: avatarStore.getState().page,
          locale: bridge?.locale,
        },
      }),
    }),
    sendAutomaticallyWhen: shouldContinueAfterTools,
    onToolCall: ({ toolCall }) => {
      if (toolCall.dynamic) return;
      const ok = runTool(toolCall);
      // Sans await (recommandé par l'AI SDK pour éviter un interblocage)
      void chat.addToolOutput(
        ok
          ? { tool: toolCall.toolName, toolCallId: toolCall.toolCallId, output: { ok: true } }
          : {
              tool: toolCall.toolName,
              toolCallId: toolCall.toolCallId,
              state: "output-error",
              errorText: TOOL_ERROR_TEXT,
            },
      );
    },
    onFinish: ({ messages, isAbort, isError, isDisconnect }) => {
      avatarStore.setSpeaking(false);
      if (isAbort || isError || isDisconnect) {
        clearPending();
        return;
      }
      // Une relance automatique va suivre : on navigue après elle
      if (shouldContinueAfterTools({ messages })) return;
      flushNavigation();
    },
    onError: () => {
      avatarStore.setSpeaking(false);
      clearPending();
    },
  });
  return chat;
}

/* ------------------------------------------------------------------ */
/* Réponses interrompues (bouton "Arrêter")                           */
/* ------------------------------------------------------------------ */

// Ids des messages après lesquels le visiteur a arrêté la réponse (store externe minimal,
// gardé avec la conversation : survit aux navigations, remis à zéro au rechargement).
let stoppedIds: ReadonlySet<string> = new Set();
const NO_STOPPED: ReadonlySet<string> = new Set();
const stoppedListeners = new Set<() => void>();

/** Marque le dernier message de la conversation comme "réponse interrompue". */
export function markStopped(messageId: string) {
  stoppedIds = new Set([...stoppedIds, messageId]);
  stoppedListeners.forEach((listener) => listener());
}

export function subscribeStopped(listener: () => void): () => void {
  stoppedListeners.add(listener);
  return () => stoppedListeners.delete(listener);
}

export const getStoppedIds = (): ReadonlySet<string> => stoppedIds;
export const getServerStoppedIds = (): ReadonlySet<string> => NO_STOPPED;

/* ------------------------------------------------------------------ */
/* Instance partagée                                                  */
/* ------------------------------------------------------------------ */

let browserChat: Chat<ChatUIMessage> | null = null;

/**
 * Instance partagée dans le navigateur. Pendant le rendu serveur (SSR des
 * composants client), une instance jetable est créée : jamais partagée entre visiteurs.
 */
export function getChat(): Chat<ChatUIMessage> {
  if (typeof window === "undefined") return createChat();
  browserChat ??= createChat();
  return browserChat;
}
