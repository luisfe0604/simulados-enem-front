import { NextRequest, NextResponse } from "next/server";
import { handleRoute, badRequest } from "@/lib/api";
import { requireActiveSubscription } from "@/lib/authz";
import { generateENEMSimulado } from "@/lib/services/enem";

// Gera as questões de um simulado ENEM por tipo: day1 | day2 | full
export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    await requireActiveSubscription();
    const type = req.nextUrl.searchParams.get("type") ?? "";

    const simulado = await generateENEMSimulado(type);
    if (simulado === null) {
      return badRequest("Tipo de simulado inválido");
    }

    return NextResponse.json(simulado);
  });
}
