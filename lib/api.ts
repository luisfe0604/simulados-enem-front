import { NextResponse } from "next/server";
import { UnauthorizedError, ForbiddenError } from "./session";

/**
 * Executa o corpo de uma rota e converte erros conhecidos em respostas HTTP.
 * - UnauthorizedError -> 401
 * - ForbiddenError    -> 403
 * - Error("XXX")      -> deixa a rota tratar antes; aqui vira 500 genérico
 */
export async function handleRoute(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    console.error(err);
    const message =
      err instanceof Error ? err.message : "Erro interno do servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Não encontrado"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}
