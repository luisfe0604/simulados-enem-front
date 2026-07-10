import React, { useState, useEffect } from "react";
import { apiFetch } from "../services/api";
import styles from "./Historico.module.css";
import QuestionCard from "../components/QuestionCard";
import { useNavigate } from "react-router-dom";

export default function Historico() {
  const [simulados, setSimulados] = useState([]);
  const [expandedSimulado, setExpandedSimulado] = useState(null);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [subscription, setSubscription] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await apiFetch("/simulados");
      const sub = await apiFetch("/billing/subscription");
      setSimulados(data.data || []);
      setSubscription(sub);
    }
    load();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function toggleExpand(simuladoId) {
    if (expandedSimulado === simuladoId) {
      setExpandedSimulado(null);
      return;
    }

    const data = await apiFetch(`/enem/simulados/${simuladoId}`);
    setSimulados((prev) =>
      prev.map((s) =>
        s.id === simuladoId ? { ...s, questions: data.questions } : s,
      ),
    );
    setExpandedSimulado(simuladoId);
  }

  function formatDuration(seconds) {
    if (!seconds) return "-";

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}m ${s}s`;
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  function renderSortIcon(field) {
    if (sortField !== field) return "⇅";

    return sortDirection === "asc" ? "⬆" : "⬇";
  }

  const filteredSimulados = simulados.filter((s) => {
    const now = new Date();
    const created = new Date(s.created_at);

    switch (activeFilter) {
      case "last7":
        return (now - created) / (1000 * 60 * 60 * 24) <= 7;

      case "last30":
        return (now - created) / (1000 * 60 * 60 * 24) <= 30;

      case "failed":
        return s.score < 50;

      case "above50":
        return s.score >= 50;

      default:
        return true;
    }
  });

  const sortedSimulados = [...filteredSimulados].sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];

    if (sortField === "created_at") {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;

    return 0;
  });

  function refazerSimulado(simuladoId) {
    navigate(`/simulado/refazer/${simuladoId}`);
  }

  const isActive = ["active", "trialing", "trial"].includes(
    subscription?.subscription_status,
  );

  function renderMobileCards() {
    return (
      <div className={styles.cards}>
        {sortedSimulados.map((s) => (
          <div
            key={s.id}
            className={styles.card}
            onClick={() => toggleExpand(s.id)}
          >
            <div className={styles.cardHeader}>
              <div>
                <strong>
                  {new Date(s.created_at).toLocaleDateString("pt-BR")}
                </strong>
                <div className={styles.cardTime}>
                  {new Date(s.created_at).toLocaleTimeString("pt-BR")}
                </div>
              </div>

              <span
                className={`${styles.score} ${
                  s.score >= 50 ? styles.good : styles.bad
                }`}
              >
                {parseFloat(s.score)}%
              </span>
            </div>

            <div className={styles.cardStats}>
              <span>{s.total_questions} questões</span>
              <span>⏱ {formatDuration(s.duration_seconds)}</span>
            </div>

            <div className={styles.cardActions}>
              <button
                className={styles.retryButton}
                onClick={() => refazerSimulado(s.id)}
              >
                Refazer
              </button>
            </div>

            {expandedSimulado === s.id && s.questions && (
              <div className={styles.cardQuestions}>
                {s.questions.map((q, index) => (
                  <QuestionCard
                    key={q.question_id}
                    q={q}
                    index={index}
                    result={true}
                    disabled={true}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Histórico de Simulados</h1>

      {!isActive && (
        <div className={styles.warningBox}>
          <div>
            <strong>Acesso limitado</strong>
            <p>
              Assine o plano Premium para desbloquear todos os simulados e
              recursos.
            </p>
          </div>

          <button
            className={styles.warningButton}
            onClick={() => navigate("/conta")}
          >
            Assinar agora
          </button>
        </div>
      )}

      <div className={styles.chips}>
        <button
          className={`${styles.chip} ${activeFilter === "all" ? styles.active : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          🔁 Todos
        </button>

        <button
          className={`${styles.chip} ${activeFilter === "last7" ? styles.active : ""}`}
          onClick={() => setActiveFilter("last7")}
        >
          📅 Últimos 7 dias
        </button>

        <button
          className={`${styles.chip} ${activeFilter === "last30" ? styles.active : ""}`}
          onClick={() => setActiveFilter("last30")}
        >
          📅 Últimos 30 dias
        </button>

        <button
          className={`${styles.chip} ${activeFilter === "failed" ? styles.active : ""}`}
          onClick={() => setActiveFilter("failed")}
        >
          ❌ Reprovados
        </button>

        <button
          className={`${styles.chip} ${activeFilter === "above50" ? styles.active : ""}`}
          onClick={() => setActiveFilter("above50")}
        >
          🏆 Acima de 50%
        </button>
      </div>

      {simulados.length === 0 ? (
        <p className={styles.empty}>Você ainda não realizou nenhum simulado.</p>
      ) : isMobile ? (
        renderMobileCards()
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>

                <th onClick={() => handleSort("created_at")}>
                  Data <span>{renderSortIcon("created_at")}</span>
                </th>

                <th onClick={() => handleSort("total_questions")}>
                  Questões <span>{renderSortIcon("total_questions")}</span>
                </th>

                <th onClick={() => handleSort("duration_seconds")}>
                  Tempo <span>{renderSortIcon("duration_seconds")}</span>
                </th>

                <th onClick={() => handleSort("score")}>
                  Nota <span>{renderSortIcon("score")}</span>
                </th>

                <th>Treine</th>
              </tr>
            </thead>
            <tbody>
              {sortedSimulados.map((s, index) => (
                <React.Fragment key={s.id}>
                  <tr
                    onClick={() => toggleExpand(s.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td
                      className={styles.expandIcon}
                      style={{
                        transform:
                          expandedSimulado === s.id
                            ? "rotate(90deg)"
                            : "rotate(0deg)",
                      }}
                    >
                      ➤
                    </td>
                    <td>
                      {(() => {
                        const date = new Date(s.created_at);
                        return (
                          date.toLocaleTimeString("pt-BR") +
                          " - " +
                          date.toLocaleDateString("pt-BR")
                        );
                      })()}
                    </td>
                    <td>{s.total_questions}</td>
                    <td>{formatDuration(s.duration_seconds)}</td>
                    <td>
                      <span
                        className={`${styles.score} ${
                          s.score >= 50 ? styles.good : styles.bad
                        }`}
                      >
                        {parseFloat(s.score)}%
                      </span>
                    </td>
                    <td className={styles.actions}>
                      <button
                        className={styles.retryButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          refazerSimulado(s.id);
                        }}
                      >
                        Refazer
                      </button>
                    </td>
                  </tr>

                  {expandedSimulado === s.id && s.questions && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={6} className={styles.expandedCell}>
                        <div className={styles.simuladoQuestions}>
                          {s.questions.map((q, index) => (
                            <QuestionCard
                              key={q.question_id}
                              q={q}
                              index={index}
                              result={true}
                              disabled={true}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
