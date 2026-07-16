import pool from "@/lib/db";

// Portado do lado ENEM do backend. O lado "OAB" (tabelas sem sufixo _enem)
// foi deliberadamente deixado de fora — este app é só do ENEM.

export interface SimuladoAnswer {
  question_id: number;
  selected_option: string;
}

// ---------- Subjects / Exams / Questions ----------

export async function getSubjects() {
  const result = await pool.query(`
    SELECT s.id, s.name, COUNT(qs.question_id) AS total_questions
      FROM public.subjects_enem s
      LEFT JOIN public.question_subjects_enem qs ON qs.subject_id = s.id
      GROUP BY s.id
      ORDER BY s.name ASC
  `);
  return result.rows;
}

export async function getExams() {
  const result = await pool.query("SELECT e.* FROM public.exams_enem e;");
  return result.rows;
}

export async function createQuestion(data: {
  statement: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_option: string;
  difficulty?: number;
  exam_id: number;
  subjects?: number[];
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      statement,
      option_a,
      option_b,
      option_c,
      option_d,
      option_e,
      correct_option,
      difficulty = 1,
      exam_id,
      subjects = [],
    } = data;

    const questionResult = await client.query(
      `INSERT INTO public.questions_enem
         (statement, option_a, option_b, option_c, option_d, option_e,
          correct_option, difficulty, exam_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        statement,
        option_a,
        option_b,
        option_c,
        option_d,
        option_e,
        correct_option,
        difficulty,
        exam_id,
      ],
    );

    const question = questionResult.rows[0];

    for (const subjectId of subjects) {
      await client.query(
        `INSERT INTO public.question_subjects_enem (question_id, subject_id)
         VALUES ($1,$2)`,
        [question.id, subjectId],
      );
    }

    await client.query("COMMIT");
    return question;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function generateQuestions({
  subject_id,
  limit,
}: {
  subject_id?: string | null;
  limit?: string | null;
}) {
  const values: unknown[] = [];
  const conditions: string[] = [];
  let index = 1;

  let query = `
    SELECT q.*, e.name as exam_name
      FROM public.questions_enem q
      LEFT JOIN public.exams_enem e ON e.id = q.exam_id
  `;

  if (subject_id) {
    query += ` JOIN public.question_subjects_enem qs ON qs.question_id = q.id`;
    conditions.push(`qs.subject_id = $${index}`);
    values.push(parseInt(subject_id, 10));
    index++;
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY RANDOM()`;

  const finalLimit = limit && !Number.isNaN(parseInt(limit, 10)) ? parseInt(limit, 10) : 20;
  query += ` LIMIT $${index}`;
  values.push(finalLimit);

  const result = await pool.query(query, values);
  return result.rows;
}

// ---------- Simulados ----------

export async function finishSimulado({
  userId,
  answers,
  duration_seconds,
}: {
  userId: number;
  answers: SimuladoAnswer[];
  duration_seconds?: number;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const questionIds = answers.map((a) => a.question_id);

    const questionsResult = await client.query<{
      id: number;
      correct_option: string;
    }>(
      `SELECT id, correct_option FROM public.questions_enem WHERE id = ANY($1)`,
      [questionIds],
    );

    const correctMap: Record<number, string> = {};
    for (const q of questionsResult.rows) {
      correctMap[q.id] = q.correct_option;
    }

    let correctAnswers = 0;
    for (const answer of answers) {
      if (correctMap[answer.question_id] === answer.selected_option) {
        correctAnswers++;
      }
    }

    const totalQuestions = answers.length;
    const score = (correctAnswers / totalQuestions) * 100;

    const simulatedResult = await client.query(
      `INSERT INTO public.simulated_exams_enem
         (user_id, total_questions, correct_answers, score, duration_seconds)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [userId, totalQuestions, correctAnswers, score, duration_seconds],
    );

    const simulatedExam = simulatedResult.rows[0];

    for (const answer of answers) {
      const isCorrect = correctMap[answer.question_id] === answer.selected_option;
      await client.query(
        `INSERT INTO public.simulated_exam_questions_enem
           (simulated_exam_id, question_id, selected_option, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [simulatedExam.id, answer.question_id, answer.selected_option, isCorrect],
      );
    }

    await client.query("COMMIT");
    return { id: simulatedExam.id, totalQuestions, correctAnswers, score };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function listSimulados({
  userId,
  page,
  limit,
}: {
  userId: number;
  page: number;
  limit: number;
}) {
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT id, total_questions, correct_answers, score, created_at, duration_seconds
       FROM public.simulated_exams_enem
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  const simulados = result.rows.map((s) => ({ ...s, score: Number(s.score) }));

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM public.simulated_exams_enem WHERE user_id = $1`,
    [userId],
  );

  const total = parseInt(countResult.rows[0].count, 10);

  return {
    data: simulados,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getSimuladoById({
  userId,
  simulatedId,
}: {
  userId: number;
  simulatedId: string;
}) {
  const simuladoResult = await pool.query(
    `SELECT id, total_questions, correct_answers, score, created_at
       FROM public.simulated_exams_enem
       WHERE id = $1 AND user_id = $2`,
    [simulatedId, userId],
  );

  if (simuladoResult.rows.length === 0) return null;

  const simulado = simuladoResult.rows[0];

  const questionsResult = await pool.query(
    `SELECT q.id as question_id, q.statement,
            q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
            q.correct_option, seq.selected_option, seq.is_correct
       FROM public.simulated_exam_questions_enem seq
       JOIN public.questions_enem q ON q.id = seq.question_id
       WHERE seq.simulated_exam_id = $1`,
    [simulatedId],
  );

  return { ...simulado, questions: questionsResult.rows };
}

export async function generateWrongQuestionsSimulado({
  userId,
  limit = 20,
}: {
  userId: number;
  limit?: number;
}) {
  const wrongQuestions = await pool.query<{ question_id: number }>(
    `SELECT question_id FROM (
        SELECT DISTINCT question_id
          FROM simulated_exam_questions_enem seq
          JOIN simulated_exams_enem se ON se.id = seq.simulated_exam_id
          WHERE se.user_id = $1 AND seq.is_correct = false
      ) q
      ORDER BY RANDOM()
      LIMIT $2`,
    [userId, limit],
  );

  if (wrongQuestions.rows.length === 0) return [];

  const ids = wrongQuestions.rows.map((r) => r.question_id);

  const questions = await pool.query(
    `SELECT q.*, e.name as exam_name
       FROM public.questions_enem q
       LEFT JOIN public.exams_enem e ON e.id = q.exam_id
       WHERE q.id = ANY($1)`,
    [ids],
  );

  return questions.rows;
}

const ENEM_DAY_1_SUBJECTS_LIMITS = [
  { id: 3, limit: 45 }, // Linguagens
  { id: 1, limit: 45 }, // Ciências Humanas
];
const ENEM_DAY_2_SUBJECTS_LIMITS = [
  { id: 4, limit: 45 }, // Matemática
  { id: 2, limit: 45 }, // Ciências da Natureza
];
const ENEM_FULL_SUBJECTS_LIMITS = [
  { id: 1, limit: 45 },
  { id: 2, limit: 45 },
  { id: 3, limit: 45 },
  { id: 4, limit: 45 },
];

async function generateBySubjectLimits(
  limits: { id: number; limit: number }[],
) {
  let simulado: unknown[] = [];
  for (const { id, limit } of limits) {
    const { rows } = await pool.query(
      `SELECT q.*, e.name as exam_name
         FROM public.questions_enem q
         JOIN public.question_subjects_enem qs ON qs.question_id = q.id
         LEFT JOIN public.exams_enem e ON e.id = q.exam_id
         WHERE qs.subject_id = $1
         ORDER BY RANDOM()
         LIMIT $2`,
      [id, limit],
    );
    simulado = simulado.concat(rows);
  }
  return simulado;
}

export function generateENEMSimulado(type: string) {
  switch (type) {
    case "day1":
      return generateBySubjectLimits(ENEM_DAY_1_SUBJECTS_LIMITS);
    case "day2":
      return generateBySubjectLimits(ENEM_DAY_2_SUBJECTS_LIMITS);
    case "full":
      return generateBySubjectLimits(ENEM_FULL_SUBJECTS_LIMITS);
    default:
      return null;
  }
}
