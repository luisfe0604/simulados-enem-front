import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import QuestionCard from "../components/QuestionCard";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Simulado.module.css";

export default function Simulado() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [limit, setLimit] = useState(10);
  const [startTime, setStartTime] = useState(null);
  const [subject, setSubject] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState("custom");
  const [showNavigator, setShowNavigator] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  const simuladoAtivo = questions.length > 0 && !result;

  useEffect(() => {
    if (id) loadRetrySimulado();

    async function loadInitialData() {
      try {
        const data = await apiFetch("/enem/subjects");
        const sub = await apiFetch("/billing/subscription");

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
  }, []);

  useEffect(() => {
    if (!startTime || result) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, result]);

  function toggleSubject(subjectId) {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );
  }

  async function generateCustomSimulado() {
    const params = new URLSearchParams();

    if (limit) params.append("limit", limit);

    if (subject) {
      params.append("subject_id", subject);
    }

    const data = await apiFetch(
      `/enem/questions/generate?${params.toString()}`,
    );

    startSimulado(data);
  }

  async function generateWrongSimulado() {
    const data = await apiFetch(
      `/enem/simulados/questions/generate-wrong?limit=${limit}`,
    );

    startSimulado(data);
  }

  async function generateExamSimulado(type) {
    const data = await apiFetch(`/enem/simulados/questions?type=${type}`);

    startSimulado(data);
  }

  function startSimulado(data) {
    setQuestions(data);
    setAnswers({});
    setResult(null);
    setStartTime(Date.now());
    setElapsed(0);
  }

  async function loadRetrySimulado() {
    const data = await apiFetch(`/enem/simulados/${id}`);

    const cleanedQuestions = data.questions.map((q) => ({
      ...q,
      id: q.id || q.question_id,
      selected_option: null,
    }));

    startSimulado(cleanedQuestions);
  }

  function handleSelect(id, option) {
    setAnswers({ ...answers, [id]: option });
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const isActive = ["active", "trialing", "trial"].includes(
    subscription?.subscription_status,
  );

  const SUBJECT_LABELS = {
    "ciencias-humanas": "Ciências Humanas",
    "ciencias-natureza": "Ciências da Natureza",
    linguagens: "Linguagens, Códigos e Redação",
    matematica: "Matemática",
  };

  async function finish() {
    if (submitting) return;

    setSubmitting(true);

    try {
      const payload = {
        duration_seconds: elapsed,
        answers: questions.map((q) => ({
          question_id: q.id,
          selected_option: answers[q.id] || "",
        })),
      };

      const data = await apiFetch("/enem/simulados", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setResult(data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Simulados ENEM</h1>

      {!isActive && (
        <div className={styles.warningBox}>
          <div>
            <strong>Acesso limitado</strong>
            <p>Assine o plano Premium para desbloquear todos os recursos.</p>
          </div>

          <button
            className={styles.warningButton}
            onClick={() => navigate("/conta")}
          >
            Assinar agora
          </button>
        </div>
      )}

      <div className={styles.simuladoModes}>
        <div
          className={`${styles.modeCard} ${mode === "custom" ? styles.modeActive : ""} ${simuladoAtivo ? styles.modeLocked : ""}`}
          onClick={() => !simuladoAtivo && setMode("custom")}
        >
          <div className={styles.modeTitle}>📚 Personalizado</div>
          <div className={styles.modeDescription}>
            Escolha matérias e quantidade de questões
          </div>
        </div>

        <div
          className={`${styles.modeCard} ${mode === "wrong" ? styles.modeActive : ""} ${simuladoAtivo ? styles.modeLocked : ""}`}
          onClick={() => !simuladoAtivo && setMode("wrong")}
        >
          <div className={styles.modeTitle}>🔁 Revisão de erros</div>
          <div className={styles.modeDescription}>
            Refaça questões respondidas incorretamente
          </div>
        </div>

        <div
          className={`${styles.modeCard} ${mode === "dia1" ? styles.modeActive : ""} ${simuladoAtivo ? styles.modeLocked : ""}`}
          onClick={() => !simuladoAtivo && setMode("dia1")}
        >
          <div className={styles.modeTitle}>📝 Prova Dia 1</div>
          <div className={styles.modeDescription}>Linguagens + Humanas</div>
        </div>

        <div
          className={`${styles.modeCard} ${mode === "dia2" ? styles.modeActive : ""} ${simuladoAtivo ? styles.modeLocked : ""}`}
          onClick={() => !simuladoAtivo && setMode("dia2")}
        >
          <div className={styles.modeTitle}>📐 Prova Dia 2</div>
          <div className={styles.modeDescription}>Matemática + Natureza</div>
        </div>

        <div
          className={`${styles.modeCard} ${mode === "full" ? styles.modeActive : ""} ${simuladoAtivo ? styles.modeLocked : ""}`}
          onClick={() => !simuladoAtivo && setMode("full")}
        >
          <div className={styles.modeTitle}>🎯 Prova Completa</div>
          <div className={styles.modeDescription}>
            Simulado completo do ENEM
          </div>
        </div>
      </div>

      {simuladoAtivo && (
        <p className={styles.lockMessage}>
          Finalize o simulado atual para mudar o tipo.
        </p>
      )}

      {mode === "custom" && (
        <div className={styles.filters}>
          <select
            value={subject}
            disabled={simuladoAtivo}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">Todos os Assuntos</option>

            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {SUBJECT_LABELS[s.name] || s.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            max="180"
            value={limit}
            disabled={simuladoAtivo}
            onChange={(e) => setLimit(e.target.value)}
          />

          <button
            className={styles.generateBtn}
            onClick={generateCustomSimulado}
          >
            Iniciar Simulado
          </button>
        </div>
      )}

      {mode === "wrong" && (
        <div className={styles.filters}>
          <input
            type="number"
            min="5"
            max="100"
            value={limit}
            disabled={simuladoAtivo}
            onChange={(e) => setLimit(e.target.value)}
          />

          <button
            className={styles.generateBtn}
            onClick={generateWrongSimulado}
          >
            Revisar erros
          </button>
        </div>
      )}

      {mode === "dia1" && (
        <div className={styles.filters}>
          <button
            className={styles.generateBtn}
            onClick={() => generateExamSimulado("day1")}
          >
            Iniciar Prova Dia 1
          </button>
        </div>
      )}

      {mode === "dia2" && (
        <div className={styles.filters}>
          <button
            className={styles.generateBtn}
            onClick={() => generateExamSimulado("day2")}
          >
            Iniciar Prova Dia 2
          </button>
        </div>
      )}

      {mode === "full" && (
        <div className={styles.filters}>
          <button
            className={styles.generateBtn}
            onClick={() => generateExamSimulado("full")}
          >
            Iniciar Prova Completa
          </button>
        </div>
      )}

      {questions.length > 0 && (
        <div className={styles.progressContainer}>
          <div className={styles.progressInfo}>
            <span>
              {Object.keys(answers).length} / {questions.length} respondidas
            </span>

            <div className={styles.progressActions}>
              <button
                className={styles.navigatorBtn}
                onClick={() => setShowNavigator(true)}
              >
                Questões
              </button>

              <span className={styles.timer}>{formatTime(elapsed)}</span>
            </div>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${(Object.keys(answers).length / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

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

      {result && (
        <div className={styles.resultInline}>
          <h2>Resultado</h2>
          <p className={styles.score}>{result.score?.toFixed(2)}%</p>
        </div>
      )}

      {questions.length > 0 && (
        <div className={styles.footer}>
          {!result ? (
            <button
              onClick={finish}
              disabled={submitting}
              className={styles.finishBtn}
            >
              Finalizar Simulado
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className={styles.finishBtn}
            >
              Novo Simulado
            </button>
          )}
        </div>
      )}

      {showNavigator && (
        <div
          className={styles.navigatorOverlay}
          onClick={() => setShowNavigator(false)}
        >
          <div
            className={styles.navigatorModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Navegar pelas questões</h3>

            <div className={styles.navigatorGrid}>
              {questions.map((q, index) => {
                const answered = answers[q.id];

                return (
                  <button
                    key={q.id}
                    className={`${styles.navItem} ${answered ? styles.navAnswered : ""}`}
                    onClick={() => {
                      document
                        .getElementById(`question-${index}`)
                        ?.scrollIntoView({ behavior: "smooth" });
                      setShowNavigator(false);
                    }}
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
