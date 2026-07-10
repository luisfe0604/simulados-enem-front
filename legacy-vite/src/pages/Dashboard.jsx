import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [simulados, setSimulados] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch("/simulados");
        const sub = await apiFetch("/billing/subscription");

        setSimulados(data.data || []);
        setSubscription(sub);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const isActive = ["active", "trialing", "trial"].includes(
    subscription?.subscription_status,
  );

  const stats = useMemo(() => {
    if (simulados.length === 0) {
      return {
        total: 0,
        average: 0,
        totalQuestions: 0,
        avgTimePerQuestion: 0,
      };
    }

    const scores = simulados.map((s) => Number(s.score));

    const total = scores.length;

    const average = scores.reduce((acc, curr) => acc + curr, 0) / total;

    // 🔹 TOTAL DE QUESTÕES
    const totalQuestions = simulados.reduce(
      (acc, s) => acc + (s.total_questions || 0),
      0,
    );

    // 🔹 TEMPO TOTAL
    const totalTime = simulados.reduce(
      (acc, s) => acc + (s.duration_seconds || 0),
      0,
    );

    // 🔹 TEMPO MÉDIO POR QUESTÃO
    const avgTimePerQuestion =
      totalQuestions > 0 ? totalTime / totalQuestions : 0;

    return {
      total,
      average: average.toFixed(1),
      totalQuestions,
      avgTimePerQuestion: Math.round(avgTimePerQuestion), // segundos
    };
  }, [simulados]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <button
          className={styles.primaryBtn}
          onClick={() => navigate("/simulado")}
        >
          + Novo Simulado
        </button>
      </div>

      {!isActive && (
        <div className={styles.warningBox}>
          <div>
            <strong>Acesso limitado</strong>
            <p>Assine para desbloquear todos os simulados e recursos.</p>
          </div>

          <button
            className={styles.warningButton}
            onClick={() => navigate("/conta")}
          >
            Assinar agora
          </button>
        </div>
      )}

      <div className={styles.cards}>
        <StatCard label="Total de Simulados" value={stats.total} />
        <StatCard label="Média Geral" value={`${stats.average}%`} />
        <StatCard label="Questões Respondidas" value={stats.totalQuestions} />
        <StatCard
          label="Tempo Médio / Questão"
          value={`${stats.avgTimePerQuestion}s`}
        />
      </div>

      <div className={styles.history}>
        <h2>Últimos Simulados</h2>

        {simulados.length === 0 && <p>Nenhum simulado realizado ainda.</p>}

        {simulados.slice(0, 5).map((s) => (
          <div key={s.id} className={styles.historyItem}>
            <span>{s.score}%</span>
            <span>
              {(() => {
                const date = new Date(s.created_at);
                return (
                  date.toLocaleTimeString("pt-BR") +
                  " - " +
                  date.toLocaleDateString("pt-BR")
                );
              })()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>{label}</p>
      <h2 className={styles.cardValue}>{value}</h2>
    </div>
  );
}
