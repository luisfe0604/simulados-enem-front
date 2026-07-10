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
      return { total: 0, average: "0.0", totalQuestions: 0, avgTimePerQuestion: 0 };
    }
    const scores = simulados.map((s) => Number(s.score));
    const total = scores.length;
    const average = scores.reduce((a, c) => a + c, 0) / total;
    const totalQuestions = simulados.reduce((a, s) => a + (s.total_questions || 0), 0);
    const totalTime = simulados.reduce((a, s) => a + (s.duration_seconds || 0), 0);
    const avgTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;
    return {
      total,
      average: average.toFixed(1),
      totalQuestions,
      avgTimePerQuestion: Math.round(avgTimePerQuestion),
    };
  }, [simulados]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <button
          onClick={() => router.push("/simulado")}
          className="rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-hover"
        >
          + Novo Simulado
        </button>
      </div>

      {!isActive && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-danger-light p-4">
          <div>
            <strong className="text-danger">Acesso limitado</strong>
            <p className="text-sm text-text-muted">
              Assine para desbloquear todos os simulados e recursos.
            </p>
          </div>
          <button
            onClick={() => router.push("/conta")}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Assinar agora
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total de Simulados" value={String(stats.total)} />
        <StatCard label="Média Geral" value={`${stats.average}%`} />
        <StatCard label="Questões Respondidas" value={String(stats.totalQuestions)} />
        <StatCard label="Tempo Médio / Questão" value={`${stats.avgTimePerQuestion}s`} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">
          Últimos Simulados
        </h2>
        {simulados.length === 0 && (
          <p className="text-text-muted">Nenhum simulado realizado ainda.</p>
        )}
        <div className="space-y-2">
          {simulados.slice(0, 5).map((s) => {
            const date = new Date(s.created_at);
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border-soft bg-bg-card px-4 py-3"
              >
                <span className="font-semibold text-text-primary">{s.score}%</span>
                <span className="text-sm text-text-muted">
                  {date.toLocaleTimeString("pt-BR")} - {date.toLocaleDateString("pt-BR")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-bg-card p-4 shadow-card">
      <p className="text-sm text-text-muted">{label}</p>
      <h2 className="mt-1 text-2xl font-bold text-text-primary">{value}</h2>
    </div>
  );
}
