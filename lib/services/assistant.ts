// Assistente de IA (Gemini). Não persiste nenhuma mensagem em banco — o
// histórico da conversa vive só no estado do client e é enviado a cada
// chamada; ao sair da tela ou recarregar a página, o contexto se perde.

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const OUT_OF_SCOPE_MESSAGE =
  "Consigo te ajudar só com dúvidas de conteúdo escolar (nível fundamental e médio) — matérias como português, matemática, ciências, história, geografia, etc. Bora reformular sua pergunta focando em algo assim? 😉";

const SYSTEM_INSTRUCTION = `Você é o assistente de estudos de uma plataforma de simulados para o ENEM e para o ensino fundamental/médio.

Responda sempre em português do Brasil, de forma correta e BREVE: poucas frases ou um parágrafo curto, evite textos longos (isso é importante para custo e simplicidade).

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
        maxOutputTokens: 400,
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
