import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { requireActiveSubscription } from "@/lib/authz";
import { listSimulados } from "@/lib/services/enem";

// Rota unificada de histórico. No sistema antigo havia GET /simulados (bare) e
// GET /enem/simulados com código idêntico lendo a mesma tabela simulated_exams.
// Aqui elas convergem para a mesma listagem. O frontend chama /simulados no
// Dashboard e Histórico.
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
