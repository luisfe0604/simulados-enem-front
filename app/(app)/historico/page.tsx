"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import QuestionCard, { type Question } from "@/components/QuestionCard";

interface Simulado {
  id: number;
  score: number;
  total_questions: number;
  duration_seconds: number;
  created_at: string;
  questions?: Question[];
}

type SortField = "created_at" | "total_questions" | "duration_seconds" | "score";
type Filter = "all" | "last7" | "last30" | "failed" | "above50";

export default function HistoricoPage() {
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const [subscription, setSubscription] = useState<{ subscription_status?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const data = await apiFetch<{ data?: Simulado[] }>("/simulados");
      const sub = await apiFetch<{ subscription_status?: string }>("/billing/subscription");
      setSimulados(data.data || []);
      setSubscription(sub);
    }
    load();
  }, []);

  async function toggleExpand(simuladoId: number) {
    if (expanded === simuladoId) {
      setExpanded(null);
      return;
    }
    const data = await apiFetch<{ questions: Question[] }>(
      `/enem/simulados/${simuladoId}`,
    );
    setSimulados((prev) =>
      prev.map((s) =>
        s.id === simuladoId ? { ...s, questions: data.questions } : s,
      ),
    );
    setExpanded(simuladoId);
  }

  function formatDuration(seconds: number) {
    if (!seconds) return "-";
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  function renderSortIcon(field: SortField) {
    if (sortField !== field) return "⇅";
    return sortDirection === "asc" ? "⬆" : "⬇";
  }

  const filtered = simulados.filter((s) => {
    const now = Date.now();
    const created = new Date(s.created_at).getTime();
    const days = (now - created) / (1000 * 60 * 60 * 24);
    switch (activeFilter) {
      case "last7":
        return days <= 7;
      case "last30":
        return days <= 30;
      case "failed":
        return s.score < 50;
      case "above50":
        return s.score >= 50;
      default:
        return true;
    }
  });

  const sorted = [...filtered].sort((a, b) => {
    const va =
      sortField === "created_at"
        ? new Date(a.created_at).getTime()
        : Number(a[sortField]);
    const vb =
      sortField === "created_at"
        ? new Date(b.created_at).getTime()
        : Number(b[sortField]);
    if (va < vb) return sortDirection === "asc" ? -1 : 1;
    if (va > vb) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const isActive = ["active", "trialing", "trial"].includes(
    subscription?.subscription_status ?? "",
  );

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "🔁 Todos" },
    { key: "last7", label: "📅 Últimos 7 dias" },
    { key: "last30", label: "📅 Últimos 30 dias" },
    { key: "failed", label: "❌ Reprovados" },
    { key: "above50", label: "🏆 Acima de 50%" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow">Sua evolução</p>
      <h1 className="mt-1 text-3xl font-bold text-text-primary">
        Histórico de Simulados
      </h1>

      {!isActive && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-danger-light p-4">
          <div>
            <strong className="text-danger">Acesso limitado</strong>
            <p className="text-sm text-text-muted">
              Assine o plano Premium para desbloquear todos os simulados.
            </p>
          </div>
          <button
            onClick={() => router.push("/conta")}
            className="btn btn-primary shrink-0"
          >
            Assinar agora
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              activeFilter === f.key
                ? "bg-primary text-white"
                : "border border-border text-text-primary hover:bg-bg-hover"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {simulados.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-text-muted">
            Nenhum simulado por aqui ainda. Faça o primeiro para ver sua evolução.
          </p>
          <button
            onClick={() => router.push("/simulado")}
            className="btn btn-primary"
          >
            Começar agora
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="mt-4 space-y-3 md:hidden">
            {sorted.map((s) => (
              <div
                key={s.id}
                onClick={() => toggleExpand(s.id)}
                className="card card-interactive p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-text-primary">
                      {new Date(s.created_at).toLocaleDateString("pt-BR")}
                    </strong>
                    <div className="text-xs text-text-muted">
                      {new Date(s.created_at).toLocaleTimeString("pt-BR")}
                    </div>
                  </div>
                  <span
                    className="score-chip"
                    style={{
                      color: s.score >= 50 ? "var(--color-success)" : "var(--color-danger)",
                      background: s.score >= 50 ? "var(--color-success-light)" : "var(--color-danger-light)",
                    }}
                  >
                    {parseFloat(String(s.score))}%
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-text-muted">
                  <span>{s.total_questions} questões</span>
                  <span>⏱ {formatDuration(s.duration_seconds)}</span>
                </div>
                <div className="mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/simulado/refazer/${s.id}`);
                    }}
                    className="btn btn-outline btn-sm"
                  >
                    Refazer
                  </button>
                </div>
                {expanded === s.id && s.questions && (
                  <div className="mt-3">
                    {s.questions.map((q, i) => (
                      <QuestionCard key={q.question_id} q={q} index={i} result disabled />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-border-soft md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-hover text-text-muted">
                <tr>
                  <th className="p-3"></th>
                  <th className="cursor-pointer p-3" onClick={() => handleSort("created_at")}>
                    Data <span>{renderSortIcon("created_at")}</span>
                  </th>
                  <th className="cursor-pointer p-3" onClick={() => handleSort("total_questions")}>
                    Questões <span>{renderSortIcon("total_questions")}</span>
                  </th>
                  <th className="cursor-pointer p-3" onClick={() => handleSort("duration_seconds")}>
                    Tempo <span>{renderSortIcon("duration_seconds")}</span>
                  </th>
                  <th className="cursor-pointer p-3" onClick={() => handleSort("score")}>
                    Nota <span>{renderSortIcon("score")}</span>
                  </th>
                  <th className="p-3">Treine</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr
                      onClick={() => toggleExpand(s.id)}
                      className="cursor-pointer border-t border-border-soft hover:bg-bg-hover"
                    >
                      <td className="p-3 text-text-muted">
                        {expanded === s.id ? "▾" : "▸"}
                      </td>
                      <td className="p-3 text-text-primary">
                        {new Date(s.created_at).toLocaleTimeString("pt-BR")} -{" "}
                        {new Date(s.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3 text-text-primary">{s.total_questions}</td>
                      <td className="p-3 text-text-primary">
                        {formatDuration(s.duration_seconds)}
                      </td>
                      <td className="p-3">
                        <span
                          className="score-chip"
                          style={{
                            color: s.score >= 50 ? "var(--color-success)" : "var(--color-danger)",
                            background: s.score >= 50 ? "var(--color-success-light)" : "var(--color-danger-light)",
                          }}
                        >
                          {parseFloat(String(s.score))}%
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/simulado/refazer/${s.id}`);
                          }}
                          className="btn btn-outline btn-sm"
                        >
                          Refazer
                        </button>
                      </td>
                    </tr>
                    {expanded === s.id && s.questions && (
                      <tr>
                        <td colSpan={6} className="bg-bg-page p-4">
                          {s.questions.map((q, i) => (
                            <QuestionCard key={q.question_id} q={q} index={i} result disabled />
                          ))}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
