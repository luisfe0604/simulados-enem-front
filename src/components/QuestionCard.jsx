import styles from "./QuestionCard.module.css";

export default function QuestionCard({
  q,
  index,
  answers,
  result,
  onSelect,
  disabled,
}) {
  function parseQuotes(text) {
    if (!text) return text;

    return text
      .replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>")

      .replace(/_([\s\S]*?)_/g, (match, content) => {
        return `<i>${content.trim()}</i>`;
      })

      .replace(
        /(([A-ZÀ-ÚÇ]{2,},\s?[A-ZÀ-ÚÇ]\.|Disponível em:|Acesso em:)[\s\S]*?(\((adaptado|fragmento)\)\s*\.?|\d{4}\s*\.?))/gi,
        (match) => {
          return `<br />${match.trim()}`;
        },
      )

      .replace(
        /!\[\]\((https?:\/\/[^\s)]+)\)/g,
        '<img src="$1" alt="Imagem da questão" class="question-image" />',
      )

      .replace(/(null){1,}/gi, "");
  }

  function splitStatement(text) {
    if (!text) return { intro: text, question: "" };

    let cleanedText = text.replace(/\r/g, "").trim();

    const adaptationPattern = /\((adaptado|fragmento)\)\s*\.?/i;
    const matches = [
      ...cleanedText.matchAll(new RegExp(adaptationPattern, "gi")),
    ];

    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const cutIndex = lastMatch.index + lastMatch[0].length;

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
      const cutIndex = lastYearMatch.index + lastYearMatch[0].length;

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
        const endOfLine = cleanedText.indexOf("\n", lastMatch.index);
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
      const question = paragraphs.pop().trim();
      const intro = paragraphs.join("\n").trim();
      return { intro, question };
    }

    return { intro: "", question: cleanedText };
  }

  const statementWithQuotes = parseQuotes(q.statement);

  const { intro, question } = splitStatement(statementWithQuotes);

  return (
    <div className={styles.questionCard}>
      <h3 className={styles.questionNumber}>Questão {index + 1}</h3>

      <div className={styles.statement}>
        {intro && <p dangerouslySetInnerHTML={{ __html: intro }} />}
        {question && <p dangerouslySetInnerHTML={{ __html: question }} />}
      </div>

      <div className={styles.options}>
        {["A", "B", "C", "D", "E"].map((letter) => {
          const optionText = q[`option_${letter.toLowerCase()}`];
          if (!optionText) return null;

          const isSelected =
            answers?.[q.id || q.question_id] === letter ||
            q.selected_option === letter;

          const isCorrect = q.correct_option === letter;
          const isWrongSelected = result && isSelected && !isCorrect;

          let className = styles.optionBtn;
          if (!result && isSelected) className += ` ${styles.selected}`;
          if (result && isCorrect) className += ` ${styles.correct}`;
          if (result && isWrongSelected) className += ` ${styles.wrong}`;

          return (
            <button
              key={letter}
              className={className}
              disabled={disabled}
              onClick={() =>
                onSelect && onSelect(q.id || q.question_id, letter)
              }
            >
              <strong>{letter + `)`}</strong> {optionText}
            </button>
          );
        })}
      </div>

      {q.exam_name && <p className={styles.exam}>{q.exam_name}</p>}
    </div>
  );
}
