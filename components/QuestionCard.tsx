"use client";

export interface Question {
  id?: number;
  question_id?: number;
  statement: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  option_e?: string;
  correct_option?: string;
  selected_option?: string | null;
  exam_name?: string;
}

interface QuestionCardProps {
  q: Question;
  index: number;
  answers?: Record<number, string>;
  result?: unknown;
  onSelect?: (questionId: number, option: string) => void;
  disabled?: boolean;
  onAskAI?: (q: Question) => void;
}

// Formatação do enunciado portada 1:1 do componente React antigo (parse de
// negrito/itálico markdown, imagens e quebras em citações).
function parseQuotes(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_([\s\S]*?)_/g, (_m, content) => `<i>${content.trim()}</i>`)
    .replace(
      /(([A-ZÀ-ÚÇ]{2,},\s?[A-ZÀ-ÚÇ]\.|Disponível em:|Acesso em:)[\s\S]*?(\((adaptado|fragmento)\)\s*\.?|\d{4}\s*\.?))/gi,
      (match) => `<br />${match.trim()}`,
    )
    .replace(
      /(^|[.:])?\s*!\[\]\((https?:\/\/[^\s)]+)\)/g,
      (_m, prefix, url) => {
        if (prefix === "") {
          return `<img src="${url}" alt="Imagem da questão" class="question-image" /><br /><br />`;
        }
        if (prefix === "." || prefix === ":") {
          return `${prefix}<br /><br /><img src="${url}" alt="Imagem da questão" class="question-image" /><br /><br />`;
        }
        return `<img src="${url}" alt="Imagem da questão" class="question-image" />`;
      },
    )
    .replace(/(null){1,}/gi, "");
}

function splitStatement(text: string): { intro: string; question: string } {
  if (!text) return { intro: text, question: "" };

  const cleanedText = text.replace(/\r/g, "").trim();

  const adaptationPattern = /\((adaptado|fragmento)\)\s*\.?/i;
  const matches = [...cleanedText.matchAll(new RegExp(adaptationPattern, "gi"))];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const cutIndex = (lastMatch.index ?? 0) + lastMatch[0].length;
    const intro = cleanedText.slice(0, cutIndex).trim();
    let question = cleanedText.slice(cutIndex).trim();
    if (question) {
      question = `<br />${question}`;
      return { intro, question };
    }
  }

  const authorAndYearPattern =
    /([A-ZÀ-ÚÇ]{2,},\s?[A-ZÀ-ÚÇ]\.[\s\S]*?\d{4}\s*\.?)/g;
  const yearMatches = [...cleanedText.matchAll(authorAndYearPattern)];
  if (yearMatches.length > 0) {
    const lastYearMatch = yearMatches[yearMatches.length - 1];
    const cutIndex = (lastYearMatch.index ?? 0) + lastYearMatch[0].length;
    const intro = cleanedText.slice(0, cutIndex).trim();
    let question = cleanedText.slice(cutIndex).trim();
    if (question) {
      question = `<br />${question}`;
      return { intro, question };
    }
  }

  const citationPatterns = [/Disponível em:/i, /Acesso em:/i];
  let lastCitationIndex = -1;
  citationPatterns.forEach((pattern) => {
    const cMatches = [...cleanedText.matchAll(new RegExp(pattern, "g"))];
    if (cMatches.length > 0) {
      const lastMatch = cMatches[cMatches.length - 1];
      const endOfLine = cleanedText.indexOf("\n", lastMatch.index ?? 0);
      if (endOfLine !== -1 && endOfLine > lastCitationIndex) {
        lastCitationIndex = endOfLine;
      }
    }
  });
  if (lastCitationIndex !== -1) {
    const intro = cleanedText.slice(0, lastCitationIndex).trim();
    let question = cleanedText.slice(lastCitationIndex).trim();
    if (question) {
      question = `<br />${question}`;
      return { intro, question };
    }
  }

  const paragraphs = cleanedText.split(/\n\s*\n/);
  if (paragraphs.length > 1) {
    const question = (paragraphs.pop() ?? "").trim();
    const intro = paragraphs.join("\n").trim();
    return { intro, question };
  }

  return { intro: "", question: cleanedText };
}

export default function QuestionCard({
  q,
  index,
  answers,
  result,
  onSelect,
  disabled,
  onAskAI,
}: QuestionCardProps) {
  const { intro, question } = splitStatement(parseQuotes(q.statement));
  const qid = (q.id ?? q.question_id) as number;

  return (
    <div className="card mb-4 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="marker">{String(index + 1).padStart(2, "0")}</span>
          <span className="eyebrow">Questão</span>
        </div>
        <div className="flex items-center gap-3">
          {onAskAI && (
            <button
              onClick={() => onAskAI(q)}
              className="text-xs text-text-muted underline-offset-2 hover:text-primary hover:underline"
            >
              Explicar com IA
            </button>
          )}
          {q.exam_name && (
            <span className="text-xs text-text-muted">{q.exam_name}</span>
          )}
        </div>
      </div>

      <div className="space-y-2 leading-relaxed text-text-primary [&_img]:my-2 [&_img]:max-w-full">
        {intro && <p dangerouslySetInnerHTML={{ __html: intro }} />}
        {question && <p dangerouslySetInnerHTML={{ __html: question }} />}
      </div>

      <div className="mt-5 space-y-2">
        {["A", "B", "C", "D", "E"].map((letter) => {
          const optionText = q[`option_${letter.toLowerCase()}` as keyof Question];
          if (!optionText) return null;

          const isSelected =
            answers?.[qid] === letter || q.selected_option === letter;
          const isCorrect = q.correct_option === letter;
          const isWrongSelected = result && isSelected && !isCorrect;

          let rowCls = "answer";
          let bubbleCls = "bubble";
          if (result && isCorrect) {
            rowCls += " answer-correct";
            bubbleCls += " bubble-correct";
          } else if (result && isWrongSelected) {
            rowCls += " answer-wrong";
            bubbleCls += " bubble-wrong";
          } else if (isSelected) {
            rowCls += " answer-selected";
            bubbleCls += " bubble-selected";
          }

          return (
            <button
              key={letter}
              className={rowCls}
              disabled={disabled}
              onClick={() => onSelect?.(qid, letter)}
            >
              <span className={bubbleCls} aria-hidden>
                {letter}
              </span>
              <span className="flex-1">{optionText}</span>
              {Boolean(result && isCorrect) && (
                <span className="font-mono text-sm font-bold text-success">✓</span>
              )}
              {Boolean(result && isWrongSelected) && (
                <span className="font-mono text-sm font-bold text-danger">✕</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
