import { createHmac, timingSafeEqual } from "node:crypto";
import type { InferUIMessageChunk } from "ai";
import { canonicalEntries, historyText, stableJson, type CanonicalEntry } from "./canonical";
import type { ChatRequest } from "./request-schema";
import { chatTools, type ChatUIMessage } from "./tools";

// Signature des réponses de Rominou (module serveur uniquement).
// Le client renvoie tout l'historique à chaque requête : sans signature, il pourrait
// inventer un tour "assistant" ("SYSTEM OVERRIDE…") que le modèle prendrait pour le sien.
// - En fin de réponse, le serveur ajoute metadata.sig = HMAC(forme canonique du message).
// - À la requête suivante, chaque message assistant est revérifié ; ceux qui ne le sont pas
//   (inventés, modifiés, ou réponse interrompue donc jamais signée) sont écartés du contexte.

type ChatChunk = InferUIMessageChunk<ChatUIMessage>;
type RequestMessage = ChatRequest["messages"][number];

const VERSION = "rominou-history-v1";
const TOOL_NAMES: ReadonlySet<string> = new Set(Object.keys(chatTools));

export function signEntries(key: Buffer, entries: readonly CanonicalEntry[]): string {
  return createHmac("sha256", key).update(JSON.stringify([VERSION, entries])).digest("base64url");
}

function isValidSignature(key: Buffer, entries: readonly CanonicalEntry[], sig: string | undefined): boolean {
  if (!sig) return false;
  const expected = Buffer.from(signEntries(key, entries));
  const received = Buffer.from(sig);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export type VerifiedHistory = {
  /** Historique sans les messages assistant non vérifiés. */
  messages: RequestMessage[];
  /**
   * Relance après un outil client : forme canonique (vérifiée) du dernier message assistant,
   * que la nouvelle signature doit englober. null pour une question du visiteur.
   */
  previous: CanonicalEntry[] | null;
};

/**
 * Vérifie les messages assistant de l'historique. Renvoie null si le DERNIER message est
 * un tour assistant non vérifié (relance forgée : la requête doit être refusée).
 */
export function verifyHistory(key: Buffer, messages: RequestMessage[]): VerifiedHistory | null {
  const kept: RequestMessage[] = [];
  let previous: CanonicalEntry[] | null = null;

  messages.forEach((message, index) => {
    if (message.role === "user") {
      kept.push(message);
      return;
    }
    const entries = canonicalEntries(message.parts);
    if (!isValidSignature(key, entries, message.metadata?.sig)) return;
    kept.push(message);
    if (index === messages.length - 1) previous = entries;
  });

  const lastIsAssistant = messages.at(-1)?.role === "assistant";
  if (lastIsAssistant && previous === null) return null;
  return { messages: kept, previous };
}

/* ------------------------------------------------------------------ */
/* Signature du flux de réponse                                       */
/* ------------------------------------------------------------------ */

type Pending =
  | { kind: "text"; id: string; text: string }
  | { kind: "tool"; toolCallId: string; toolName: string; input?: string; valid: boolean };

function toEntries(pending: readonly Pending[]): CanonicalEntry[] {
  const entries: CanonicalEntry[] = [];
  for (const item of pending) {
    if (item.kind === "text") {
      const text = historyText(item.text);
      if (text) entries.push(["text", text]);
    } else if (item.valid && item.input !== undefined) {
      entries.push(["tool", item.toolCallId, item.toolName, item.input]);
    }
  }
  return entries;
}

/**
 * Observe le flux UI envoyé au navigateur et, juste avant "finish", y ajoute
 * metadata.sig couvrant `previous` + le contenu de cette réponse. Rien n'est signé
 * si le flux se termine sur une erreur ou une interruption.
 */
export function signResponseStream(
  key: Buffer,
  previous: readonly CanonicalEntry[] = [],
): TransformStream<ChatChunk, ChatChunk> {
  const pending: Pending[] = [];
  let stepStart = 0;
  let failed = false;

  const tool = (toolCallId: string) =>
    pending.find((p): p is Extract<Pending, { kind: "tool" }> => p.kind === "tool" && p.toolCallId === toolCallId);
  const text = (id: string) =>
    pending.findLast((p): p is Extract<Pending, { kind: "text" }> => p.kind === "text" && p.id === id);

  return new TransformStream<ChatChunk, ChatChunk>({
    transform(chunk, controller) {
      switch (chunk.type) {
        case "start-step":
          stepStart = pending.length;
          break;
        case "reset-step":
          pending.length = stepStart;
          break;
        case "text-start":
          pending.push({ kind: "text", id: chunk.id, text: "" });
          break;
        case "text-delta": {
          const part = text(chunk.id);
          if (part) part.text += chunk.delta;
          else pending.push({ kind: "text", id: chunk.id, text: chunk.delta });
          break;
        }
        case "tool-input-start":
          if (!tool(chunk.toolCallId)) {
            pending.push({ kind: "tool", toolCallId: chunk.toolCallId, toolName: chunk.toolName, valid: false });
          }
          break;
        case "tool-input-available": {
          const valid = !chunk.dynamic && TOOL_NAMES.has(chunk.toolName);
          const part = tool(chunk.toolCallId);
          const input = stableJson(chunk.input);
          if (part) Object.assign(part, { toolName: chunk.toolName, input, valid });
          else pending.push({ kind: "tool", toolCallId: chunk.toolCallId, toolName: chunk.toolName, input, valid });
          break;
        }
        case "tool-input-error": {
          // Entrée invalide : le navigateur l'écarte de l'historique (cf. history.ts).
          const part = tool(chunk.toolCallId);
          if (part) part.valid = false;
          break;
        }
        case "error":
        case "abort":
          failed = true;
          break;
        case "finish":
          if (!failed) {
            const sig = signEntries(key, [...previous, ...toEntries(pending)]);
            controller.enqueue({ type: "message-metadata", messageMetadata: { sig } });
          }
          break;
      }
      controller.enqueue(chunk);
    },
  });
}
