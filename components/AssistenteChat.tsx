"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { IconSpark } from "@/components/icons";

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
    <div className="rise-in mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"
          style={{ background: "linear-gradient(155deg, var(--color-ai), var(--color-ai-hover))" }}
          aria-hidden
        >
          <IconSpark className="h-4.5 w-4.5" />
        </span>
        <h1 className="text-2xl font-bold text-text-primary">{ASSISTANT_NAME}</h1>
      </div>

      <div className="glow card mt-4 flex flex-1 flex-col overflow-hidden p-0">
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
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-white"
                    : "border border-border-soft bg-bg-hover text-text-primary"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl border border-border-soft bg-bg-hover px-3.5 py-2.5 text-sm text-text-muted">
                <span
                  className="inline-block h-1.5 w-1.5 animate-bounce rounded-full"
                  style={{ background: "var(--color-ai)", animationDelay: "0ms" }}
                />
                <span
                  className="inline-block h-1.5 w-1.5 animate-bounce rounded-full"
                  style={{ background: "var(--color-ai)", animationDelay: "120ms" }}
                />
                <span
                  className="inline-block h-1.5 w-1.5 animate-bounce rounded-full"
                  style={{ background: "var(--color-ai)", animationDelay: "240ms" }}
                />
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
            className="btn btn-ai"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
