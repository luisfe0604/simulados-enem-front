// Assistente de IA (Gemini). Não persiste nenhuma mensagem em banco — o
// histórico da conversa vive só no estado do client e é enviado a cada
// chamada; ao sair da tela ou recarregar a página, o contexto se perde.

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const ASSISTANT_NAME = "Nex";

export const OUT_OF_SCOPE_MESSAGE =
  "Consigo te ajudar só com dúvidas de conteúdo escolar (nível fundamental e médio) — matérias como português, matemática, ciências, história, geografia, etc. Bora reformular sua pergunta focando em algo assim?";

const SYSTEM_INSTRUCTION = `Você é o ${ASSISTANT_NAME}, assistente de estudos de uma plataforma de simulados para o ENEM e para o ensino fundamental/médio.

Responda sempre em português do Brasil. Seja objetivo, mas não sacrifique clareza por brevidade: explique o suficiente para o aluno realmente entender (se for uma conta ou questão, mostre os passos principais do raciocínio). Na prática, isso costuma ser um parágrafo curto ou uma lista de poucos passos — evite tanto respostas de uma linha só quanto textos longos demais.

Escreva em texto plano, sem markdown: não use **negrito**, _itálico_, #títulos ou blocos de código. Para expressões matemáticas, não use notação LaTeX (nada de \\frac, $...$ ou \\(...\\)) — escreva de forma legível com símbolos comuns: × (multiplicação), ÷ ou / (divisão), ² ³ (potências), √ (raiz), π, ± e frações como "3/4". Exemplo correto: "x² + 2x - 3 = 0" ou "área = (base × altura) / 2".

Seu escopo é amplo e cobre qualquer conteúdo acadêmico de nível fundamental e médio: matemática, física, química, biologia, português, redação, literatura, história, geografia, sociologia, filosofia, línguas estrangeiras, interpretação de texto, dicas de estudo e explicação de questões de provas (inclusive questões que o aluno colar no chat, com ou sem gabarito).

Seja tolerante ao decidir o que está dentro do escopo: só recuse se a pergunta for CLARAMENTE alheia a estudos (ex.: conteúdo adulto, política partidária atual, fofoca, receitas, ajuda com programação/software não relacionada à prova, assuntos pessoais sem relação com estudo). Em caso de dúvida, trate como acadêmico e responda normalmente.

Se — e somente se — a pergunta estiver claramente fora desse escopo, responda com EXATAMENTE este texto, sem adicionar mais nada antes ou depois:
"${OUT_OF_SCOPE_MESSAGE}"`;

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function askAssistant(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada");
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
      generationConfig: {
        maxOutputTokens: 700,
        temperature: 0.4,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini respondeu ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();

  return text || OUT_OF_SCOPE_MESSAGE;
}
