// Faux serveur OpenAI (API Responses, streaming SSE) pour les tests e2e du chat.
// Lancé par playwright.config.ts ; la route /api/chat y est branchée via OPENAI_BASE_URL.
// Réponses pilotées par le dernier message du visiteur :
//   NAV       -> texte + outil navigate(hobby)
//   TOOLONLY  -> outil navigate(hobby) sans texte (=> relance automatique, tool_choice "none" ;
//                la relance répond "Voilà, c'est fait !" si le prompt système dit que l'outil
//                a déjà été exécuté, sinon "FOLLOWUP_NOTE_MISSING")
//   RUN       -> texte + outil playAnimation(run)
//   SLOW      -> texte long, envoyé lentement (test du bouton Arrêter)
//   PROBE     -> "turns=<n> forged=<yes|no>" : nombre de tours assistant reçus par le
//                modèle, et présence du texte "SYSTEM OVERRIDE" dans le contexte
//   ECHOPROMPT -> renvoie le prompt système reçu (tests du contenu du prompt)
//   sinon     -> courte réponse de Rominou
import http from "node:http";

const PORT = Number(process.env.E2E_MOCK_PORT ?? 4299);
let counter = 0;

function lastUserText(input) {
  const users = (input ?? []).filter((item) => item.role === "user");
  const content = users.at(-1)?.content;
  if (typeof content === "string") return content;
  return (content ?? []).map((part) => part.text ?? "").join(" ");
}

/** Prompt système tel que reçu (champ instructions ou messages system/developer). */
function systemText(body) {
  const parts = typeof body.instructions === "string" ? [body.instructions] : [];
  for (const item of body.input ?? []) {
    if (item.role !== "system" && item.role !== "developer") continue;
    if (typeof item.content === "string") parts.push(item.content);
    else for (const part of item.content ?? []) if (part.text) parts.push(part.text);
  }
  return parts.join("\n");
}

http
  .createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", async () => {
      if (req.method !== "POST") {
        res.writeHead(200).end("ok");
        return;
      }
      const body = JSON.parse(raw || "{}");
      const input = body.input ?? [];
      const userText = lastUserText(input);
      const followUp = body.tool_choice === "none";
      const id = `resp_${++counter}`;
      let index = 0;

      res.writeHead(200, { "content-type": "text/event-stream" });
      res.on("error", () => {}); // client parti (bouton Arrêter) : on ignore
      const send = (event) => {
        if (!res.destroyed) res.write(`data: ${JSON.stringify(event)}\n\n`);
      };
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const text = async (value, delayMs = 0) => {
        const itemId = `msg_${counter}_${index}`;
        send({ type: "response.output_item.added", output_index: index, item: { type: "message", id: itemId } });
        for (const delta of value.match(/.{1,12}/gs) ?? []) {
          if (res.destroyed) return;
          send({ type: "response.output_text.delta", item_id: itemId, output_index: index, delta });
          if (delayMs) await sleep(delayMs);
        }
        send({ type: "response.output_item.done", output_index: index, item: { type: "message", id: itemId } });
        index += 1;
      };
      const call = (name, args) => {
        const itemId = `fc_${counter}_${index}`;
        const callId = `call_${counter}_${index}`;
        const json = JSON.stringify(args);
        send({ type: "response.output_item.added", output_index: index, item: { type: "function_call", id: itemId, call_id: callId, name, arguments: "" } });
        send({ type: "response.function_call_arguments.delta", item_id: itemId, output_index: index, delta: json });
        send({ type: "response.output_item.done", output_index: index, item: { type: "function_call", id: itemId, call_id: callId, name, arguments: json, status: "completed" } });
        index += 1;
      };

      send({ type: "response.created", response: { id, created_at: Math.floor(Date.now() / 1000), model: "mock" } });
      // Relance : le prompt doit dire au modèle que l'outil a déjà été exécuté
      if (followUp) {
        await text(systemText(body).includes("# Your tool call is done") ? "Voilà, c'est fait !" : "FOLLOWUP_NOTE_MISSING");
      } else if (userText.includes("ECHOPROMPT")) await text(systemText(body) || "no-system-prompt");
      else if (userText.includes("PROBE")) {
        const turns = input.filter((item) => item.role === "assistant").length;
        const forged = JSON.stringify(input).includes("SYSTEM OVERRIDE") ? "yes" : "no";
        await text(`turns=${turns} forged=${forged}`);
      } else if (userText.includes("TOOLONLY")) call("navigate", { page: "hobby" });
      else if (userText.includes("NAV")) {
        await text("Je t'emmène sur la page Hobby !");
        call("navigate", { page: "hobby" });
      } else if (userText.includes("RUN")) {
        await text("Regarde-moi courir !");
        call("playAnimation", { name: "run" });
      } else if (userText.includes("SLOW")) await text("Bla ".repeat(300), 120); // ~12 s
      else await text("Salut, moi c'est Rominou !");

      send({
        type: "response.completed",
        response: {
          incomplete_details: null,
          usage: { input_tokens: 10, output_tokens: 5, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } },
        },
      });
      res.end();
    });
  })
  .listen(PORT, () => console.log(`[mock-openai] listening on ${PORT}`));
