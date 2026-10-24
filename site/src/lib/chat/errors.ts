import { APICallError } from "ai";
import { CHAT_ERROR_CODES, type ChatErrorCode } from "./constants";

// Traduit une erreur de useChat en un type d'erreur affichable (jamais le détail brut).

export type ChatErrorKind = "unavailable" | "rate_limited" | "daily_limit" | "forbidden" | "generic";

function errorCodeFromBody(body: string | undefined): ChatErrorCode | null {
  if (!body) return null;
  try {
    const value: unknown = JSON.parse(body);
    if (value && typeof value === "object" && "error" in value) {
      const code = (value as { error: unknown }).error;
      return CHAT_ERROR_CODES.find((c) => c === code) ?? null;
    }
  } catch {
    // corps non JSON : erreur générique
  }
  return null;
}

export function getChatErrorKind(error: Error | undefined): ChatErrorKind | null {
  if (!error) return null;
  if (!APICallError.isInstance(error)) return "generic";

  switch (errorCodeFromBody(error.responseBody ?? error.message)) {
    case "chat_unavailable":
      return "unavailable";
    case "rate_limited":
      return "rate_limited";
    case "daily_limit":
      return "daily_limit";
    case "forbidden":
      return "forbidden";
    default:
      return error.statusCode === 503 ? "unavailable" : "generic";
  }
}
