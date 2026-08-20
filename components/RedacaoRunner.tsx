"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/client-api";
import { IconFeather } from "@/components/icons";

interface CompetenciaResult {
  numero: number;
  titulo: string;
  nota: number;
  comentario: string;
}

interface EssayGrade {
  competencias: CompetenciaResult[];
  notaTotal: number;
  comentarioGeral: string;
}

function scoreColor(total: number) {
  if (total >= 600) return "var(--color-success)";
  if (total >= 400) return "var(--color-warm)";
  return "var(--color-danger)";
}

export default function RedacaoRunner() {
  const [tema, setTema] = useState("");
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EssayGrade | null>(null);

  const wordCount = texto.trim() ? texto.trim().split(/\s+/).length : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !tema.trim() || texto.trim().length < 50) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<EssayGrade>("/enem/redacao", {
        method: "POST",
        body: JSON.stringify({ tema: tema.trim(), texto: texto.trim() }),
      });
      setResult(data);
    } catch {
      setError("Não consegui corrigir agora. Tenta de novo em instantes.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setTexto("");
  }

  if (result) {
    return (
      <div className="rise-in space-y-4">
        <div className="glow panel overflow-hidden">
          <div className="panel-body relative overflow-hidden text-center">
            <p className="text-sm text-text-muted">Nota final</p>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span
                className="font-mono text-6xl font-bold tabular-nums"
                style={{ color: scoreColor(result.notaTotal) }}
              >
                {result.notaTotal}
              </span>
              <span className="text-xl font-semibold text-text-muted">/1000</span>
            </div>
            <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">
              {result.comentarioGeral}
            </p>
            <div
              aria-hidden
              className="watermark-number absolute -bottom-8 -right-4 text-[8rem]"
              style={{ color: "color-mix(in srgb, var(--color-text-primary) 4%, transparent)" }}
            >
              {result.notaTotal}
            </div>
          </div>
        </div>

        <div className="panel divide-y divide-border-soft">
          {result.competencias.map((c) => (
            <div key={c.numero} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="eyebrow">Competência {c.numero}</span>
                <span
                  className="font-mono text-sm font-bold tabular-nums"
                  style={{ color: c.nota >= 120 ? "var(--color-success)" : c.nota >= 80 ? "var(--color-warm)" : "var(--color-danger)" }}
                >
                  {c.nota}/200
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-text-primary">{c.titulo}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-hover">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(c.nota / 200) * 100}%`,
                    background: c.nota >= 120 ? "var(--color-success)" : c.nota >= 80 ? "var(--color-warm)" : "var(--color-danger)",
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-text-muted">{c.comentario}</p>
            </div>
          ))}
        </div>

        <button onClick={handleReset} className="btn btn-outline">
          Nova redação
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rise-in space-y-3">
      <div>
        <label className="field-label">Tema da redação</label>
        <input
          type="text"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          placeholder="Ex: Os desafios para a valorização de comunidades tradicionais no Brasil"
          disabled={loading}
          className="input mt-1"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="field-label">Texto</label>
          <span className="text-xs text-text-muted">{wordCount} palavras</span>
        </div>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva sua redação aqui..."
          disabled={loading}
          rows={12}
          className="input mt-1 resize-y"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading || !tema.trim() || texto.trim().length < 50}
        className="btn btn-warm"
      >
        <IconFeather className="h-4 w-4" />
        {loading ? "Corrigindo com NexAI..." : "Corrigir com NexAI"}
      </button>
    </form>
  );
}
