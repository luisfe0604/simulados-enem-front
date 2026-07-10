import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForProfile } from "@/lib/google";
import { findOrCreateByEmail } from "@/lib/services/users";
import { setSessionCookie } from "@/lib/session";

// Callback do Google: troca o code por perfil, cria/acha o usuário, seta o
// cookie httpOnly e volta para a home. Diferente do backend antigo, o token
// NÃO vai na URL (?token=) — fica só no cookie httpOnly, mais seguro.
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  try {
    const { email, name } = await exchangeCodeForProfile({ code, origin });
    const user = await findOrCreateByEmail({ name, email });
    await setSessionCookie(user.id);
    return NextResponse.redirect(`${origin}/`);
  } catch (err) {
    console.error("Erro no callback do Google:", err);
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }
}
