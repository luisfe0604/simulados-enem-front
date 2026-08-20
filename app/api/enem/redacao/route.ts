import { NextRequest, NextResponse } from "next/server";
import { handleRoute, badRequest } from "@/lib/api";
import { requireActiveSubscription } from "@/lib/authz";
import { gradeEssay } from "@/lib/services/essay";

const MAX_TEMA_LENGTH = 300;
const MIN_TEXTO_LENGTH = 50;
const MAX_TEXTO_LENGTH = 8000;

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    await requireActiveSubscription();

    const body = await req.json().catch(() => null);
    const tema = typeof body?.tema === "string" ? body.tema.trim() : "";
    const texto = typeof body?.texto === "string" ? body.texto.trim() : "";

    if (!tema || tema.length > MAX_TEMA_LENGTH) {
      return badRequest("Informe um tema válido");
    }
    if (texto.length < MIN_TEXTO_LENGTH) {
      return badRequest("Escreva um pouco mais antes de enviar para correção");
    }
    if (texto.length > MAX_TEXTO_LENGTH) {
      return badRequest("Texto muito longo");
    }

    const grade = await gradeEssay(tema, texto);
    return NextResponse.json(grade);
  });
}
