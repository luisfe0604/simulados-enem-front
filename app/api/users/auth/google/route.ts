import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/google";

// Inicia o login com Google: redireciona o usuário para a tela de consentimento.
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  // `system` era usado no backend p/ escolher entre OAB e ENEM. Aqui só há o
  // app do ENEM, mas preservamos o parâmetro no state por compatibilidade.
  const system = req.nextUrl.searchParams.get("system") ?? "enem";

  const url = buildGoogleAuthUrl({ origin, state: system });
  return NextResponse.redirect(url);
}
