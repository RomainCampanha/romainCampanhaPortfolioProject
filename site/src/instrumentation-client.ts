import { initBotId } from "botid/client/core";

// Vercel BotID : protège l'endpoint du chat contre les bots
// (côté serveur : checkBotId() de "botid/server" dans la route).
initBotId({
  protect: [{ path: "/api/chat", method: "POST" }],
});
