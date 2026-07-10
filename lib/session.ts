import { cookies } from "next/headers";
import {
  TOKEN_COOKIE,
  tokenCookieOptions,
  signToken,
  verifyToken,
  type SessionPayload,
} from "./auth";

// Helpers de sessão para uso em Route Handlers / Server Components (runtime Node).
// O middleware NÃO usa este arquivo — ele lê o cookie direto do request no Edge.

export async function setSessionCookie(userId: number): Promise<void> {
  const token = await signToken(userId);
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, tokenCookieOptions);
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(TOKEN_COOKIE, "", { ...tokenCookieOptions, maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  return verifyToken(token);
}

/**
 * Retorna o userId da sessão ou lança — use nas rotas que exigem autenticação.
 * O erro é capturado pelo wrapper `requireAuth` das rotas.
 */
export async function requireUserId(): Promise<number> {
  const session = await getSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session.userId;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Não autenticado");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Acesso negado") {
    super(message);
    this.name = "ForbiddenError";
  }
}
