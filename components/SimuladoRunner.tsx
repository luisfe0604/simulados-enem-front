"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import QuestionCard, { type Question } from "@/components/QuestionCard";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

interface Subject {
  id: number;
  name: string;
}

interface Subscription {
  subscription_status?: string;
}

type Mode = "custom" | "wrong" | "dia1" | "dia2" | "full";

const SUBJECT_LABELS: Record<string, string> = {
  "ciencias-humanas": "Ciências Humanas",
  "ciencias-natureza": "Ciências da Natureza",
  linguagens: "Linguagens",
  matematica: "Matemática",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  "1": "Fácil",
  "2": "Médio",
  "3": "Difícil",
};

export default function SimuladoRunner({ retryId }: { retryId?: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{ score?: number } | null>(null);
  const [limit, setLimit] = useState(10);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState<Mode>("custom");
  const [showNavigator, setShowNavigator] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const simuladoAtivo = questions.length > 0 && !result;

  useBodyScrollLock(showNavigator);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const data = await apiFetch<Subject[]>("/enem/subjects");
        const sub = await apiFetch<Subscription>("/billing/subscription");
        setSubjects(data);
        setSubscription(sub);
      } catch {
        setSubjects([
          { id: 1, name: "Linguagens" },
          { id: 2, name: "Matemática" },
          { id: 3, name: "Ciências Humanas" },
          { id: 4, name: "Ciências da Natureza" },
        ]);
      }
    }
    loadInitialData();
    if (retryId) loadRetrySimulado(retryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryId]);

  useEffect(() => {
    if (!startTime || result) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, result]);

  function startSimulado(data: Question[]) {
    setQuestions(data);
    setAnswers({});
    setResult(null);
    setStartTime(Date.now());
    setElapsed(0);
  }

  async function generateCustomSimulado() {
    const params = new URLSearchParams();
    if (limit) params.append("limit", String(limit));
    if (subject) params.append("subject_id", subject);
    if (difficulty) params.append("difficulty", difficulty);
    const data = await apiFetch<Question[]>(
      `/enem/questions/generate?${params.toString()}`,
    );
    startSimulado(data);
  }

  async function generateWrongSimulado() {
    const data = await apiFetch<Question[]>(
      `/enem/simulados/questions/generate-wrong?limit=${limit}`,
    );
    startSimulado(data);
  }

  async function generateExamSimulado(type: string) {
    const data = await apiFetch<Question[]>(
      `/enem/simulados/questions?type=${type}`,
    );
    startSimulado(data);
  }

  async function loadRetrySimulado(id: string) {
    const data = await apiFetch<{ questions: Question[] }>(
      `/enem/simulados/${id}`,
    );
    const cleaned = data.questions.map((q) => ({
      ...q,
      id: q.id || q.question_id,
      selected_option: null,
    }));
    startSimulado(cleaned);
  }

  function handleSelect(id: number, option: string) {
    setAnswers((prev) => ({ ...prev, [id]: option }));
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  async function finish() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        duration_seconds: elapsed,
        answers: questions.map((q) => ({
          question_id: q.id,
          selected_option: answers[q.id as number] || "",
        })),
      };
      const data = await apiFetch<{ score?: number }>("/enem/simulados", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(data);
    } finally {
      setSubmitting(false);
    }
  }

  const isActive = ["active", "trialing", "trial"].includes(
    subscription?.subscription_status ?? "",
  );

  const MODES: { key: Mode; title: string; desc: string }[] = [
    { key: "custom", title: "📚 Personalizado", desc: "Escolha matérias e quantidade" },
    { key: "wrong", title: "🔁 Revisão de erros", desc: "Refaça questões erradas" },
    { key: "dia1", title: "📝 Prova Dia 1", desc: "Linguagens + Humanas" },
    { key: "dia2", title: "📐 Prova Dia 2", desc: "Matemática + Natureza" },
    { key: "full", title: "🎯 Prova Completa", desc: "Simulado completo do ENEM" },
  ];

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Praticar</p>
      <h1 className="mt-1 text-3xl font-bold text-text-primary">Simulados ENEM</h1>
      <p className="mt-1 text-sm text-text-muted">
        Monte sua prova, cronometre e receba o gabarito na hora.
      </p>

      {!isActive && (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-border-soft border-l-4 border-l-danger bg-danger-light/50 px-4 py-3">
          <div>
            <strong className="text-danger">Acesso limitado</strong>
            <p className="text-sm text-text-muted">
              Assine o plano Premium para desbloquear todos os recursos.
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

      <div className="panel mt-6">
        <div className="panel-header">
          <span className="eyebrow">Tipo de prova</span>
          {simuladoAtivo && (
            <span className="text-xs text-text-muted">
              Finalize o atual para trocar
            </span>
          )}
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => !simuladoAtivo && setMode(m.key)}
                disabled={simuladoAtivo}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  mode === m.key
                    ? "border-primary bg-primary-light"
                    : "border-border-soft bg-bg-card hover:bg-bg-hover"
                } ${simuladoAtivo ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <div className="font-medium text-text-primary">{m.title}</div>
                <div className="text-xs text-text-muted">{m.desc}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {mode === "custom" && (
          <>
            <select
              value={subject}
              disabled={simuladoAtivo}
              onChange={(e) => setSubject(e.target.value)}
              className="input w-auto"
            >
              <option value="">Todos os Assuntos</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {SUBJECT_LABELS[s.name] || s.name}
                </option>
              ))}
            </select>
            <select
              value={difficulty}
              disabled={simuladoAtivo}
              onChange={(e) => setDifficulty(e.target.value)}
              className="input w-auto"
            >
              <option value="">Todas as Dificuldades</option>
              {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={180}
              value={limit}
              disabled={simuladoAtivo}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="input w-24"
            />
            <button onClick={generateCustomSimulado} className="btn btn-primary">
              Iniciar Simulado
            </button>
          </>
        )}
        {mode === "wrong" && (
          <>
            <input
              type="number"
              min={5}
              max={100}
              value={limit}
              disabled={simuladoAtivo}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="input w-24"
            />
            <button onClick={generateWrongSimulado} className="btn btn-primary">
              Revisar erros
            </button>
          </>
        )}
        {mode === "dia1" && (
          <button onClick={() => generateExamSimulado("day1")} className="btn btn-primary">
            Iniciar Prova Dia 1
          </button>
        )}
        {mode === "dia2" && (
          <button onClick={() => generateExamSimulado("day2")} className="btn btn-primary">
            Iniciar Prova Dia 2
          </button>
        )}
            {mode === "full" && (
              <button onClick={() => generateExamSimulado("full")} className="btn btn-primary">
                Iniciar Prova Completa
              </button>
            )}
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        // top-16 (64px) = logo abaixo do Navbar (sticky top-0, ~63px de altura),
        // senão os dois ficam sobrepostos na mesma posição ao rolar a página.
        <div className="sticky top-16 z-10 mt-6 rounded-lg border border-border bg-bg-card p-3 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg font-bold tabular-nums text-text-primary">
                {String(answeredCount).padStart(2, "0")}
                <span className="text-text-muted">
                  /{String(questions.length).padStart(2, "0")}
                </span>
              </span>
              <span className="eyebrow">respondidas</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNavigator(true)}
                className="btn btn-outline btn-sm"
              >
                Cartão-resposta
              </button>
              <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-primary">
                <span aria-hidden>⏱</span>
                {formatTime(elapsed)}
              </span>
            </div>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-bg-hover">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4">
        {questions.map((q, index) => (
          <div id={`question-${index}`} key={q.id}>
            <QuestionCard
              q={q}
              index={index}
              answers={answers}
              result={result}
              onSelect={handleSelect}
              disabled={!!result}
            />
          </div>
        ))}
      </div>

      {result &&
        (() => {
          const score = Number(result.score ?? 0);
          const good = score >= 50;
          return (
            <div className="card mt-6 p-8 text-center">
              <p className="eyebrow">Resultado do simulado</p>
              <div className="mt-3 flex items-baseline justify-center gap-1">
                <span
                  className="font-mono text-6xl font-bold tabular-nums"
                  style={{
                    color: good
                      ? "var(--color-success)"
                      : "var(--color-danger)",
                  }}
                >
                  {score.toFixed(0)}
                </span>
                <span className="text-2xl font-semibold text-text-muted">%</span>
              </div>
              <p className="mt-2 text-sm text-text-muted">
                {good
                  ? "Acima da média — continue nesse ritmo."
                  : "Abaixo de 50%. Revise os erros e tente de novo."}
              </p>
            </div>
          );
        })()}

      {questions.length > 0 && (
        <div className="mt-6">
          {!result ? (
            <button
              onClick={finish}
              disabled={submitting}
              className="btn btn-primary btn-block"
            >
              {submitting ? "Enviando..." : "Finalizar Simulado"}
            </button>
          ) : (
            <button
              onClick={() => router.push("/simulado")}
              className="btn btn-primary btn-block"
            >
              Novo Simulado
            </button>
          )}
        </div>
      )}

      {showNavigator && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowNavigator(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border-soft bg-bg-card p-5 shadow-strong"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="eyebrow">Cartão-resposta</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
                {answeredCount}/{questions.length}
              </span>
            </div>
            <p className="mb-4 text-xs text-text-muted">
              Toque numa questão para ir até ela.
            </p>
            <div className="mb-4 flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-primary" />
                Respondida
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border-[1.5px] border-border" />
                Pendente
              </span>
            </div>
            <div className="grid grid-cols-6 justify-items-center gap-2.5">
              {questions.map((q, index) => {
                const answered = answers[q.id as number];
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      document
                        .getElementById(`question-${index}`)
                        ?.scrollIntoView({ behavior: "smooth" });
                      setShowNavigator(false);
                    }}
                    aria-label={`Questão ${index + 1}${answered ? " (respondida)" : ""}`}
                    className={`bubble ${answered ? "bubble-selected" : "hover:border-primary"}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
