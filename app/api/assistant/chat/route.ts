import { NextRequest, NextResponse } from "next/server";
import { handleRoute, badRequest } from "@/lib/api";
import { requireActiveSubscription } from "@/lib/authz";
import { askAssistant, type ChatMessage } from "@/lib/services/assistant";

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    await requireActiveSubscription();

    const body = await req.json().catch(() => null);
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return badRequest("Envie ao menos uma mensagem");
    }

    const valid = messages.every(
      (m) =>
        m &&
        (m.role === "user" || m.role === "model") &&
        typeof m.text === "string" &&
        m.text.length > 0 &&
        m.text.length <= MAX_MESSAGE_LENGTH,
    );
    if (!valid) {
      return badRequest("Mensagens inválidas");
    }

    const trimmed: ChatMessage[] = messages.slice(-MAX_MESSAGES);
    const reply = await askAssistant(trimmed);

    return NextResponse.json({ reply });
  });
}
