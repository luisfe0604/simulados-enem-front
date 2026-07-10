import { NextRequest, NextResponse } from "next/server";
import { handleRoute, badRequest } from "@/lib/api";
import { requireActiveSubscription } from "@/lib/authz";
import { finishSimulado, listSimulados } from "@/lib/services/enem";

// POST: finaliza um simulado (corrige e persiste)
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const userId = await requireActiveSubscription();
    const { answers, duration_seconds } = await req.json();

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return badRequest("Respostas inválidas");
    }

    const result = await finishSimulado({ userId, answers, duration_seconds });
    return NextResponse.json(result, { status: 201 });
  });
}

// GET: lista o histórico de simulados do usuário
export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const userId = await requireActiveSubscription();
    const { searchParams } = req.nextUrl;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;

    const result = await listSimulados({ userId, page, limit });
    return NextResponse.json(result);
  });
}
