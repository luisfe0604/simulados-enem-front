import { NextRequest, NextResponse } from "next/server";
import { handleRoute, badRequest } from "@/lib/api";
import { registerUser } from "@/lib/services/users";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return badRequest("Nome, email e senha são obrigatórios");
    }

    try {
      const user = await registerUser({ name, email, password });
      await setSessionCookie(user.id);
      return NextResponse.json({ user }, { status: 201 });
    } catch (err) {
      // Erros de validação de negócio viram 400, não 500
      const message = err instanceof Error ? err.message : "Erro ao registrar";
      return badRequest(message);
    }
  });
}
