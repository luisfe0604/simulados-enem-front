// Correção de redação (Gemini) nos moldes do ENEM: 5 competências, 0-1000.
// Não persiste em banco — a correção vive só na resposta da requisição.

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

const RESPONSE_SCHEMA = {
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Uma tentativa "presa" (o modelo demora ~20s só pra devolver 503) não pode
// consumir sozinha o orçamento de tempo da function — por isso cada tentativa
// tem um timeout curto próprio, e o retry conta com esse tempo liberado.
const ATTEMPT_TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 4;

async function callGemini(apiKey: string, tema: string, texto: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
  try {
    return await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [
          {
            role: "user",
            parts: [{ text: `TEMA: ${tema}\n\nTEXTO:\n${texto}` }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1600,
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function gradeEssay(tema: string, texto: string): Promise<EssayGrade> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada");
  }

  // 503 (UNAVAILABLE) e timeout são transitórios — a própria documentação do
  // Gemini recomenda retry. Sem isso, picos de demanda derrubam a correção
  // à toa (uma tentativa presa já chega a levar ~20s só pra falhar).
  let res: Response | null = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      res = await callGemini(apiKey, tema, texto);
      if (res.ok || res.status !== 503) break;
    } catch (err) {
      lastError = err;
      res = null;
    }
    await sleep(400 * (attempt + 1));
  }

  if (!res) {
    throw new Error(`Gemini não respondeu a tempo: ${String(lastError)}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini respondeu ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();

  if (!raw) {
    throw new Error("Gemini não retornou correção");
  }

  const parsed = JSON.parse(raw) as {
    competencias: { nota: number; comentario: string }[];
    comentarioGeral: string;
  };

  const competencias: CompetenciaResult[] = COMPETENCIAS.map((titulo, i) => {
    const c = parsed.competencias[i];
    const notaBruta = Number(c?.nota ?? 0);
    const nota = Math.min(200, Math.max(0, Math.round(notaBruta / 40) * 40));
    return { numero: i + 1, titulo, nota, comentario: c?.comentario ?? "" };
  });

  const notaTotal = competencias.reduce((sum, c) => sum + c.nota, 0);

  return { competencias, notaTotal, comentarioGeral: parsed.comentarioGeral ?? "" };
}
