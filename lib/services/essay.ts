// Correção de redação: 5 competências, 0-1000, nos moldes do ENEM.
// Não persiste em banco — a correção vive só na resposta da requisição.
//
// Cadeia de resiliência (cada etapa só roda se a anterior esgotar as
// tentativas): 2 modelos Gemini (pools de capacidade separados, mesma
// GEMINI_API_KEY) e, por último, Claude como fallback de outro provedor —
// pensado pra picos de instabilidade que afetam o Gemini inteiro, não só um
// modelo específico. O orçamento total fica em ~49s, dentro do
// maxDuration=60 declarado na rota.

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

export const COMPETENCIAS = [
  "Domínio da norma culta da língua escrita",
  "Compreensão da proposta e aplicação de conceitos das várias áreas de conhecimento para desenvolver o tema",
  "Seleção, relação, organização e interpretação de informações, fatos, opiniões e argumentos em defesa de um ponto de vista",
  "Domínio dos mecanismos linguísticos necessários para a construção da argumentação",
  "Proposta de intervenção para o problema abordado, com respeito aos direitos humanos",
];

const SYSTEM_INSTRUCTION = `Você é um corretor de redações nos moldes oficiais do ENEM. Vai receber um TEMA e um TEXTO escrito por um estudante do ensino médio, e deve corrigir usando exatamente as 5 competências oficiais do ENEM, nesta ordem:

1. ${COMPETENCIAS[0]}
2. ${COMPETENCIAS[1]}
3. ${COMPETENCIAS[2]}
4. ${COMPETENCIAS[3]}
5. ${COMPETENCIAS[4]}

Para cada competência, dê uma nota que seja um múltiplo de 40 entre 0 e 200 (0, 40, 80, 120, 160 ou 200), exatamente como a banca do ENEM faz, e um comentário curto (2-4 frases) explicando o que justifica essa nota — aponte acertos e problemas concretos do texto, com exemplos quando fizer sentido, sem enrolação.

Se o texto for muito curto, fugir do tema, não for uma dissertação argumentativa ou tiver outro problema grave, isso deve se refletir nas notas das competências afetadas (principalmente a 2), não em uma recusa — sempre corrija e dê nota.

Responda em português do Brasil, em texto plano (sem markdown, sem LaTeX).`;

const GRADE_SCHEMA = {
  type: "object",
  properties: {
    competencias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nota: { type: "integer" },
          comentario: { type: "string" },
        },
        required: ["nota", "comentario"],
      },
    },
    comentarioGeral: {
      type: "string",
      description: "2-4 frases de avaliação geral do texto, direto ao ponto.",
    },
  },
  required: ["competencias", "comentarioGeral"],
};

export interface CompetenciaResult {
  numero: number;
  titulo: string;
  nota: number;
  comentario: string;
}

export interface EssayGrade {
  competencias: CompetenciaResult[];
  notaTotal: number;
  comentarioGeral: string;
}

interface RawGrade {
  competencias: { nota: number; comentario: string }[];
  comentarioGeral: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// ---------- Gemini ----------

// Observado na prática que o Gemini às vezes trava >20s sem responder nada
// (não só 503 rápido) — por isso timeout via AbortController em vez de
// deixar o fetch decidir sozinho quando desistir.
const GEMINI_SLOTS = [
  { model: "gemini-flash-latest", timeoutMs: 14_000 },
  { model: "gemini-flash-lite-latest", timeoutMs: 10_000 },
];

async function callGemini(apiKey: string, model: string, timeoutMs: number, tema: string, texto: string) {
  return fetchWithTimeout(
    `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: `TEMA: ${tema}\n\nTEXTO:\n${texto}` }] }],
        generationConfig: {
          maxOutputTokens: 1600,
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: GRADE_SCHEMA,
        },
      }),
    },
    timeoutMs,
  );
}

async function tryGemini(tema: string, texto: string): Promise<RawGrade | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  for (let i = 0; i < GEMINI_SLOTS.length; i++) {
    const { model, timeoutMs } = GEMINI_SLOTS[i];
    try {
      const res = await callGemini(apiKey, model, timeoutMs, tema, texto);
      if (res.ok) {
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? "")
          .join("")
          .trim();
        if (raw) return JSON.parse(raw) as RawGrade;
      }
      // Não-503 (ex.: 400 de payload inválido) não se resolve tentando de
      // novo — só continua a cadeia se for sobrecarga.
      if (res.status !== 503) return null;
    } catch {
      // timeout/erro de rede: transitório, segue pra próxima tentativa.
    }
    if (i < GEMINI_SLOTS.length - 1) await sleep(400);
  }
  return null;
}

// ---------- Claude (fallback de outro provedor) ----------

const CLAUDE_TOOL = {
  name: "enviar_correcao",
  description: "Envia a correção estruturada da redação.",
  input_schema: GRADE_SCHEMA,
};

async function callClaude(apiKey: string, timeoutMs: number, tema: string, texto: string) {
  return fetchWithTimeout(
    CLAUDE_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1600,
        system: SYSTEM_INSTRUCTION,
        messages: [{ role: "user", content: `TEMA: ${tema}\n\nTEXTO:\n${texto}` }],
        tools: [CLAUDE_TOOL],
        tool_choice: { type: "tool", name: CLAUDE_TOOL.name },
      }),
    },
    timeoutMs,
  );
}

const CLAUDE_TIMEOUTS = [14_000, 10_000];

async function tryClaude(tema: string, texto: string): Promise<RawGrade | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  for (let i = 0; i < CLAUDE_TIMEOUTS.length; i++) {
    try {
      const res = await callClaude(apiKey, CLAUDE_TIMEOUTS[i], tema, texto);
      if (res.ok) {
        const data = await res.json();
        const toolUse = data?.content?.find((b: { type?: string }) => b.type === "tool_use");
        if (toolUse?.input) return toolUse.input as RawGrade;
        return null;
      }
      // 5xx (sobrecarga) é transitório; qualquer outro erro (payload, auth)
      // não se resolve tentando de novo.
      if (res.status < 500) return null;
    } catch {
      // timeout/erro de rede: transitório, segue pra próxima tentativa.
    }
    if (i < CLAUDE_TIMEOUTS.length - 1) await sleep(400);
  }
  return null;
}

// ---------- Orquestração ----------

function normalize(parsed: RawGrade): EssayGrade {
  const competencias: CompetenciaResult[] = COMPETENCIAS.map((titulo, i) => {
    const c = parsed.competencias[i];
    const notaBruta = Number(c?.nota ?? 0);
    const nota = Math.min(200, Math.max(0, Math.round(notaBruta / 40) * 40));
    return { numero: i + 1, titulo, nota, comentario: c?.comentario ?? "" };
  });

  const notaTotal = competencias.reduce((sum, c) => sum + c.nota, 0);

  return { competencias, notaTotal, comentarioGeral: parsed.comentarioGeral ?? "" };
}

export async function gradeEssay(tema: string, texto: string): Promise<EssayGrade> {
  const gemini = await tryGemini(tema, texto);
  if (gemini) return normalize(gemini);

  const claude = await tryClaude(tema, texto);
  if (claude) return normalize(claude);

  throw new Error("Não foi possível corrigir a redação — Gemini e Claude indisponíveis no momento.");
}
