import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { requireActiveSubscription } from "@/lib/authz";
import { generateWrongQuestionsSimulado } from "@/lib/services/enem";

// Gera um simulado com as questões que o usuário já errou antes.
export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const userId = await requireActiveSubscription();
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10) || 20;

    const questions = await generateWrongQuestionsSimulado({ userId, limit });
    return NextResponse.json(questions);
  });
}
