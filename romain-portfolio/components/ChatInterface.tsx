"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Salut ! Je suis Romain 👋 Comment puis-je t'aider aujourd'hui ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Erreur API");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let assistantContent = "";
      const assistantMessageId = Date.now().toString();
      let buffer = ""; // Buffer pour accumuler les chunks incomplets

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Ajouter au buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Parser ligne par ligne (pas chunk par chunk)
          const lines = buffer.split("\n");
          
          // Garder la dernière ligne incomplète dans le buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || "";
                
                if (content) {
                  assistantContent += content;
                  
                  setMessages((prev) => {
                    const existing = prev.find((m) => m.id === assistantMessageId);
                    if (existing) {
                      return prev.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: assistantContent }
                          : m
                      );
                    } else {
                      return [
                        ...prev,
                        {
                          id: assistantMessageId,
                          role: "assistant",
                          content: assistantContent,
                          timestamp: new Date(),
                        },
                      ];
                    }
                  });
                }
              } catch (e) {
                // Ignorer les erreurs de parsing
              }
            }
          }
        }
      }

      setIsTyping(false);
    } catch (error) {
      console.error("Erreur:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Désolé, une erreur s'est produite. Peux-tu réessayer ?",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30"
                    : "bg-white/10 text-white border border-white/20 backdrop-blur-sm shadow-lg"
                }`}
              >
                <p className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </p>
                <span className="text-xs opacity-60 mt-1 block">
                  {message.timestamp.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/10 bg-black/20 backdrop-blur-md p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écris ton message ici..."
            disabled={isLoading}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3
                     text-white placeholder:text-white/50
                     focus:outline-none focus:ring-2 focus:ring-purple-500/50
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-br from-purple-500 to-indigo-600 
                     text-white rounded-xl px-6 py-3 font-semibold
                     hover:shadow-lg hover:shadow-purple-500/50
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 hover:scale-105
                     active:scale-95"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}