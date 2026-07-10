import { NextRequest, NextResponse } from "next/server";
import { handleRoute, badRequest } from "@/lib/api";
import { loginUser } from "@/lib/services/users";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const { email, password } = await req.json();

    if (!email || !password) {
      return badRequest("Email e senha são obrigatórios");
    }

    try {
      const userId = await loginUser({ email, password });
      await setSessionCookie(userId);
      return NextResponse.json({ ok: true });
    } catch (err) {
      // "Usuário não encontrado" / "Senha inválida" -> 401
      const message = err instanceof Error ? err.message : "Credenciais inválidas";
      return NextResponse.json({ error: message }, { status: 401 });
    }
  });
}
