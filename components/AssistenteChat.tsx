"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/client-api";

// Mantido em sincronia com ASSISTANT_NAME em lib/services/assistant.ts
// (não importamos direto de lá para não misturar código client/server).
const ASSISTANT_NAME = "NexAI";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export const PENDING_QUESTION_KEY = "assistente:pergunta_pendente";

export default function AssistenteChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_QUESTION_KEY);
    if (pending) {
      sessionStorage.removeItem(PENDING_QUESTION_KEY);
      send(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const next = [...messages, { role: "user" as const, text: trimmed }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ reply: string }>("/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ messages: next }),
      });
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch {
      setError("Não consegui responder agora. Tenta de novo em instantes.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <h1 className="text-2xl font-bold text-text-primary">{ASSISTANT_NAME}</h1>

      <div className="card mt-4 flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="text-sm text-text-muted">Manda sua dúvida.</p>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-white"
                    : "bg-bg-hover text-text-primary"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg bg-bg-hover px-3.5 py-2.5 text-sm text-text-muted">
                {ASSISTANT_NAME} está pensando...
              </div>
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-border-soft p-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida..."
            disabled={loading}
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
