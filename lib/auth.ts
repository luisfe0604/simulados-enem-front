import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

// Este módulo é edge-safe (usado tanto em Route Handlers Node quanto no
// middleware.ts que roda no Edge Runtime). Por isso NÃO importar `next/headers`
// aqui — os helpers de cookie ficam em lib/session.ts.

export const TOKEN_COOKIE = "token";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias, igual ao backend antigo

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurada");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: number;
}

export async function signToken(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    // O backend antigo emitia tokens ora como { userId }, ora como { id }.
    // Aceitamos ambos para não invalidar sessões emitidas antes da migração.
    const rawId = payload.userId ?? payload.id;
    const userId = Number(rawId);
    if (!userId || Number.isNaN(userId)) return null;
    return { userId };
  } catch {
    return null;
  }
}

export const tokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: TOKEN_MAX_AGE_SECONDS,
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
