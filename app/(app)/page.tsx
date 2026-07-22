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
      <div className="flex flex-wrap items-end justify-between gap-4 rise-in">
        <div>
          <p className="eyebrow">Seu progresso</p>
          <h1 className="mt-1 text-3xl font-bold text-text-primary sm:text-4xl">
            Dashboard
          </h1>
        </div>
        <button onClick={() => router.push("/simulado")} className="btn btn-primary">
          + Novo Simulado
        </button>
      </div>

      {!isActive && (
        <div
          className="rise-in mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border-soft border-l-4 border-l-primary bg-primary-light/50 px-5 py-4"
          style={{ "--stagger": 1 } as React.CSSProperties}
        >
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

      {/* Boletim: a média como gauge radial — a assinatura visual da tela. */}
      <div
        className="glow rise-in panel mt-6"
        style={{ "--stagger": 2 } as React.CSSProperties}
      >
        <div className="panel-header">
          <span className="eyebrow">Boletim</span>
          <span className="text-xs text-text-muted">
            {hasData
              ? `em ${stats.total} simulado${stats.total > 1 ? "s" : ""}`
              : "sem dados ainda"}
          </span>
        </div>
        <div className="panel-body">
          <ScoreGauge value={hasData ? stats.average : null} />
        </div>
      </div>

      {/* Indicadores */}
      <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard eyebrow="Total" label="Simulados" value={String(stats.total)} stagger={3} />
        <StatCard eyebrow="Volume" label="Questões" value={String(stats.totalQuestions)} stagger={4} />
        <StatCard eyebrow="Ritmo" label="Seg / questão" value={`${stats.avgTimePerQuestion}s`} stagger={5} />
      </div>

      <div className="rise-in mt-8" style={{ "--stagger": 6 } as React.CSSProperties}>
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

// Gauge semicircular 0–100: o arco preenche da esquerda pro fim conforme a
// média, com o número no centro — a mesma lógica de "nota de prova" do resto
// do app, só que como forma em vez de régua.
function ScoreGauge({ value }: { value: number | null }) {
  const [animated, setAnimated] = useState(0);
  const hasData = value !== null;
  const clamped = Math.min(Math.max(value ?? 0, 0), 100);
  const good = clamped >= 50;

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(hasData ? clamped : 0));
    return () => cancelAnimationFrame(id);
  }, [clamped, hasData]);

  const r = 84;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - animated / 100);
  const color = !hasData
    ? "var(--color-border)"
    : good
      ? "var(--color-success)"
      : "var(--color-danger)";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[280px]">
        <svg viewBox="0 0 208 118" className="w-full overflow-visible">
          <path d="M16 108 A 84 84 0 0 1 192 108" className="gauge-track" />
          <path
            d="M16 108 A 84 84 0 0 1 192 108"
            className="gauge-progress"
            style={{
              stroke: color,
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">
          <div className="flex items-baseline gap-1">
            <span
              className="font-mono text-5xl font-bold tabular-nums transition-colors"
              style={{ color }}
            >
              {hasData ? clamped.toFixed(0) : "—"}
            </span>
            <span className="text-xl font-semibold text-text-muted">%</span>
          </div>
          <p className="mt-0.5 text-xs text-text-muted">média de acertos</p>
        </div>
      </div>
      <div className="mt-1 flex w-full max-w-[280px] justify-between px-1 font-mono text-[0.625rem] text-text-muted">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}

function StatCard({
  eyebrow,
  label,
  value,
  stagger,
}: {
  eyebrow: string;
  label: string;
  value: string;
  stagger: number;
}) {
  return (
    <div
      className="rise-in card p-4"
      style={{ "--stagger": stagger } as React.CSSProperties}
    >
      <p className="eyebrow">{eyebrow}</p>
      <p className="mt-2 font-mono text-3xl font-bold text-text-primary tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-sm text-text-muted">{label}</p>
    </div>
  );
}
