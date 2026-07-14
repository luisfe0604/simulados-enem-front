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
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border-soft border-l-4 border-l-primary bg-primary-light/50 px-5 py-4">
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

      {/* Boletim: a média situada numa régua 0–100, como a nota de um exame. */}
      <div className="panel mt-6">
        <div className="panel-header">
          <span className="eyebrow">Boletim</span>
          <span className="text-xs text-text-muted">
            {hasData
              ? `em ${stats.total} simulado${stats.total > 1 ? "s" : ""}`
              : "sem dados ainda"}
          </span>
        </div>
        <div className="panel-body relative overflow-hidden">
          <p className="text-sm text-text-muted">Média geral de acertos</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className="font-mono text-6xl font-bold tabular-nums"
              style={{
                color: !hasData
                  ? "var(--color-text-muted)"
                  : stats.average >= 50
                    ? "var(--color-success)"
                    : "var(--color-danger)",
              }}
            >
              {hasData ? stats.average.toFixed(0) : "—"}
            </span>
            <span className="text-2xl font-semibold text-text-muted">%</span>
          </div>

          {/* Régua 0–100 com marcador na média e o corte de 50%. */}
          <div className="mt-5 max-w-md">
            <div className="relative h-2 w-full rounded-full bg-bg-hover">
              <div className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-border" />
              <div
                className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm"
                style={{
                  left: `${hasData ? Math.min(Math.max(stats.average, 0), 100) : 0}%`,
                  background: !hasData
                    ? "var(--color-border)"
                    : stats.average >= 50
                      ? "var(--color-success)"
                      : "var(--color-danger)",
                }}
              />
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[0.625rem] text-text-muted">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <div
            aria-hidden
            className="watermark-number absolute -bottom-6 -right-2 text-[7rem]"
            style={{ color: "color-mix(in srgb, var(--color-text-primary) 4%, transparent)" }}
          >
            {hasData ? stats.average.toFixed(0) : "0"}
          </div>
        </div>
      </div>

      {/* Indicadores */}
      <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard eyebrow="Total" label="Simulados" value={String(stats.total)} />
        <StatCard eyebrow="Volume" label="Questões" value={String(stats.totalQuestions)} />
        <StatCard eyebrow="Ritmo" label="Seg / questão" value={`${stats.avgTimePerQuestion}s`} />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Últimos simulados</h2>
          {hasData && (
            <button
              onClick={() => router.push("/historico")}
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver histórico →
            </button>
          )}
        </div>

        {!hasData ? (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-text-muted">
              Nenhum simulado ainda. Faça o primeiro para abrir seu boletim.
            </p>
            <button onClick={() => router.push("/simulado")} className="btn btn-primary">
              Começar agora
            </button>
          </div>
        ) : (
          <div className="panel divide-y divide-border-soft">
            {simulados.slice(0, 5).map((s) => {
              const date = new Date(s.created_at);
              const good = s.score >= 50;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
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
                  <span className="font-mono text-sm text-text-muted tabular-nums">
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
