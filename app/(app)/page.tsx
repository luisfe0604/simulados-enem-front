"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";

interface Simulado {
  id: number;
  score: number;
  total_questions: number;
  duration_seconds: number;
  created_at: string;
}

interface Subscription {
  subscription_status?: string;
}

export default function DashboardPage() {
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<{ data?: Simulado[] }>("/simulados");
        const sub = await apiFetch<Subscription>("/billing/subscription");
        setSimulados(data.data || []);
        setSubscription(sub);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const isActive = ["active", "trialing", "trial"].includes(
    subscription?.subscription_status ?? "",
  );

  const stats = useMemo(() => {
    if (simulados.length === 0) {
      return { total: 0, average: 0, totalQuestions: 0, avgTimePerQuestion: 0 };
    }
    const scores = simulados.map((s) => Number(s.score));
    const total = scores.length;
    const average = scores.reduce((a, c) => a + c, 0) / total;
    const totalQuestions = simulados.reduce((a, s) => a + (s.total_questions || 0), 0);
    const totalTime = simulados.reduce((a, s) => a + (s.duration_seconds || 0), 0);
    const avgTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;
    return { total, average, totalQuestions, avgTimePerQuestion: Math.round(avgTimePerQuestion) };
  }, [simulados]);

  const hasData = simulados.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Seu progresso</p>
          <h1 className="mt-1 text-3xl font-bold text-text-primary">Dashboard</h1>
        </div>
        <button onClick={() => router.push("/simulado")} className="btn btn-primary">
          + Novo Simulado
        </button>
      </div>

      {!isActive && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary-light bg-primary-light/60 p-5">
          <div>
            <strong className="text-primary">Desbloqueie tudo</strong>
            <p className="text-sm text-text-muted">
              Assine para liberar simulados ilimitados e todos os recursos.
            </p>
          </div>
          <button onClick={() => router.push("/conta")} className="btn btn-primary">
            Assinar agora
          </button>
        </div>
      )}

      {/* Hero: média em destaque — a "nota" é o protagonista da marca. */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="brand-gradient relative overflow-hidden rounded-2xl p-6 text-white lg:col-span-1">
          <p className="eyebrow text-white/70">Média geral</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-6xl font-bold tabular-nums">
              {hasData ? stats.average.toFixed(0) : "—"}
            </span>
            <span className="text-2xl font-semibold text-white/80">%</span>
          </div>
          <p className="mt-1 text-sm text-white/70">
            {hasData
              ? `em ${stats.total} simulado${stats.total > 1 ? "s" : ""}`
              : "Faça seu primeiro simulado"}
          </p>
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-8 -right-4 select-none font-display text-[7rem] font-bold leading-none text-white/10"
          >
            {hasData ? stats.average.toFixed(0) : "0"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2">
          <StatCard eyebrow="Total" label="Simulados" value={String(stats.total)} />
          <StatCard eyebrow="Volume" label="Questões" value={String(stats.totalQuestions)} />
          <StatCard eyebrow="Ritmo" label="Seg / questão" value={`${stats.avgTimePerQuestion}s`} />
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Últimos simulados</h2>
          {hasData && (
            <button
              onClick={() => router.push("/historico")}
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver histórico
            </button>
          )}
        </div>

        {!hasData ? (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-text-muted">Você ainda não fez nenhum simulado.</p>
            <button onClick={() => router.push("/simulado")} className="btn btn-primary">
              Começar agora
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {simulados.slice(0, 5).map((s) => {
              const date = new Date(s.created_at);
              const good = s.score >= 50;
              return (
                <div
                  key={s.id}
                  className="card flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="score-chip"
                      style={{
                        color: good ? "var(--color-success)" : "var(--color-danger)",
                        background: good
                          ? "var(--color-success-light)"
                          : "var(--color-danger-light)",
                      }}
                    >
                      {Number(s.score).toFixed(0)}%
                    </span>
                    <span className="text-sm text-text-muted">
                      {s.total_questions} questões
                    </span>
                  </div>
                  <span className="text-sm text-text-muted tabular">
                    {date.toLocaleDateString("pt-BR")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  eyebrow,
  label,
  value,
}: {
  eyebrow: string;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-4">
      <p className="eyebrow">{eyebrow}</p>
      <p className="mt-2 font-mono text-3xl font-bold text-text-primary tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-sm text-text-muted">{label}</p>
    </div>
  );
}
