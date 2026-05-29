import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import styles from "./NewQuestion.module.css";

export default function NewQuestion() {
  const [form, setForm] = useState({
    statement: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    option_e: "",
    correct_option: "",
    exam_id: "",
    subjects: [],
  });

  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [subjectsData, examsData] = await Promise.all([
          apiFetch("/enem/subjects"),
          apiFetch("/enem/exams"),
        ]);

        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        setExams(Array.isArray(examsData) ? examsData : []);
      } catch (err) {
        console.error("Erro ao carregar dados", err);
      }
    }

    loadData();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!form.statement.trim()) {
      return alert("Enunciado obrigatório");
    }

    if (!form.option_a || !form.option_b || !form.option_c || !form.option_d) {
      return alert("Preencha A, B, C e D");
    }

    if (!form.correct_option) {
      return alert("Selecione a alternativa correta");
    }

    if (!form.exam_id) {
      return alert("Selecione uma prova");
    }

    if (!form.subjects.length) {
      return alert("Selecione um assunto");
    }

    setLoading(true);

    try {
        console.log(form)
      await apiFetch("/enem/questions", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          option_e: form.option_e || null,
        }),
      });

      alert("Questão criada com sucesso!");

      setForm({
        statement: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        option_e: "",
        correct_option: "",
        exam_id: "",
        subjects: [],
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao criar questão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Criar Questão</h2>

      <form onSubmit={handleSubmit} className={styles.card}>
        {/* 📚 Assunto */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Assunto</label>
          <select
            className={styles.select}
            value={form.subjects[0] || ""}
            onChange={(e) =>
              handleChange(
                "subjects",
                e.target.value ? [Number(e.target.value)] : [],
              )
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

        {/* 📝 Prova */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Prova</label>
          <select
            className={styles.select}
            value={form.exam_id || ""}
            onChange={(e) =>
              handleChange(
                "exam_id",
                e.target.value ? Number(e.target.value) : "",
              )
            }
          >
            <option value="">Selecione</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        {/* ✍️ Enunciado */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Enunciado</label>
          <textarea
            className={styles.textarea}
            value={form.statement}
            onChange={(e) => handleChange("statement", e.target.value)}
          />
        </div>

        {/* 🔘 Alternativas */}
        <h4 className={styles.sectionTitle}>Alternativas</h4>

        <div className={styles.options}>
          {["a", "b", "c", "d", "e"].map((letter) => {
            const upper = letter.toUpperCase();
            const isSelected = form.correct_option === upper;

            return (
              <div
                key={letter}
                className={`${styles.optionCard} ${
                  isSelected ? styles.selected : ""
                }`}
                onClick={() => handleChange("correct_option", upper)}
              >
                <span className={styles.optionLabel}>{upper}</span>

                <input
                  type="text"
                  className={styles.optionInput}
                  placeholder={`Digite a alternativa ${upper} ${
                    letter === "e" ? "(opcional)" : ""
                  }`}
                  value={form[`option_${letter}`]}
                  onChange={(e) =>
                    handleChange(`option_${letter}`, e.target.value)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
        </div>

        {/* 🚀 Botão */}
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Criando..." : "Criar Questão"}
        </button>
      </form>
    </div>
  );
}
