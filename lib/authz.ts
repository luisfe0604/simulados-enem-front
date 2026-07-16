import pool from "./db";
import { requireUserId, ForbiddenError } from "./session";

// Espelha os middlewares do backend antigo (admin.middleware / paid.middleware):
// a autorização é sempre reconferida no banco, nunca confiando só no token.

export async function requireAdmin(): Promise<number> {
  const userId = await requireUserId();

  const { rows } = await pool.query(
    "SELECT is_admin FROM public.users_enem WHERE id = $1",
    [userId],
  );

  if (rows.length === 0) {
    throw new ForbiddenError("Usuário não encontrado");
  }
  if (!rows[0].is_admin) {
    throw new ForbiddenError();
  }

  return userId;
}

export async function requireActiveSubscription(): Promise<number> {
  const userId = await requireUserId();

  const { rows } = await pool.query(
    "SELECT subscription_status, is_admin FROM public.users_enem WHERE id = $1",
    [userId],
  );

  if (rows.length === 0) {
    throw new ForbiddenError("Usuário não encontrado");
  }

  const user = rows[0];
  if (user.is_admin) return userId; // admin sempre passa, igual ao backend

  const allowed = ["active", "trialing", "trial"];
  if (!allowed.includes(user.subscription_status)) {
    throw new ForbiddenError("Plano inativo");
  }

  return userId;
}
