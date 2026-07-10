"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";

interface Subject {
  id: number;
  name: string;
}
interface Exam {
  id: number;
  name: string;
}

const EMPTY_FORM = {
  statement: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  option_e: "",
  correct_option: "",
  exam_id: "" as number | "",
  subjects: [] as number[],
};

export default function NewQuestionClient() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [subjectsData, examsData] = await Promise.all([
          apiFetch<Subject[]>("/enem/subjects"),
          apiFetch<Exam[]>("/enem/exams"),
        ]);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        setExams(Array.isArray(examsData) ? examsData : []);
      } catch (err) {
        console.error("Erro ao carregar dados", err);
      }
    }
    loadData();
  }, []);

  function handleChange<K extends keyof typeof EMPTY_FORM>(
    field: K,
    value: (typeof EMPTY_FORM)[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!form.statement.trim()) return alert("Enunciado obrigatório");
    if (!form.option_a || !form.option_b || !form.option_c || !form.option_d)
      return alert("Preencha A, B, C e D");
    if (!form.correct_option) return alert("Selecione a alternativa correta");
    if (!form.exam_id) return alert("Selecione uma prova");
    if (!form.subjects.length) return alert("Selecione um assunto");

    setLoading(true);
    try {
      await apiFetch("/enem/questions", {
        method: "POST",
        body: JSON.stringify({ ...form, option_e: form.option_e || null }),
      });
      alert("Questão criada com sucesso!");
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error(err);
      alert("Erro ao criar questão");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-text-primary";

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-text-primary">Criar Questão</h2>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-border-soft bg-bg-card p-6 shadow-card">
        <div className="space-y-1">
          <label className="text-sm font-medium text-text-primary">Assunto</label>
          <select
            className={inputCls}
            value={form.subjects[0] || ""}
            onChange={(e) =>
              handleChange("subjects", e.target.value ? [Number(e.target.value)] : [])
            }
          >
            <option value="">Selecione</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-text-primary">Prova</label>
          <select
            className={inputCls}
            value={form.exam_id || ""}
            onChange={(e) =>
              handleChange("exam_id", e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Selecione</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-text-primary">Enunciado</label>
          <textarea
            className={`${inputCls} min-h-32`}
            value={form.statement}
            onChange={(e) => handleChange("statement", e.target.value)}
          />
        </div>

        <h4 className="font-semibold text-text-primary">Alternativas</h4>
        <div className="space-y-2">
          {(["a", "b", "c", "d", "e"] as const).map((letter) => {
            const upper = letter.toUpperCase();
            const isSelected = form.correct_option === upper;
            return (
              <div
                key={letter}
                onClick={() => handleChange("correct_option", upper)}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-colors ${
                  isSelected ? "border-primary bg-primary-light" : "border-border"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-hover font-semibold text-text-primary">
                  {upper}
                </span>
                <input
                  type="text"
                  className="flex-1 bg-transparent text-text-primary outline-none"
                  placeholder={`Digite a alternativa ${upper} ${letter === "e" ? "(opcional)" : ""}`}
                  value={form[`option_${letter}`]}
                  onChange={(e) => handleChange(`option_${letter}`, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
        </div>
        <p className="text-xs text-text-muted">
          Clique na letra/linha para marcar a alternativa correta.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? "Criando..." : "Criar Questão"}
        </button>
      </form>
    </div>
  );
}
