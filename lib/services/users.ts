import pool from "@/lib/db";
import { hashPassword, comparePassword } from "@/lib/auth";

export interface PublicUser {
  id: number;
  name: string;
  email: string;
}

export async function registerUser({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<PublicUser> {
  if (!password || password.length < 6) {
    throw new Error("Senha deve ter pelo menos 6 caracteres");
  }

  const existing = await pool.query(
    "SELECT id FROM public.users WHERE email = $1",
    [email],
  );
  if (existing.rows.length > 0) {
    throw new Error("Email já cadastrado");
  }

  const hashed = await hashPassword(password);

  const result = await pool.query<PublicUser>(
    `INSERT INTO public.users
       (name, email, password_hash, plan, subscription_status)
     VALUES ($1, $2, $3, 'free', 'inactive')
     RETURNING id, name, email`,
    [name, email, hashed],
  );

  return result.rows[0];
}

export async function loginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<number> {
  const result = await pool.query<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM public.users WHERE email = $1",
    [email],
  );
  const user = result.rows[0];

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new Error("Senha inválida");
  }

  return user.id;
}

export async function findOrCreateByEmail({
  name,
  email,
}: {
  name: string;
  email: string;
}): Promise<{ id: number }> {
  const existing = await pool.query<{ id: number }>(
    "SELECT id FROM public.users WHERE email = $1",
    [email],
  );
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const result = await pool.query<{ id: number }>(
    `INSERT INTO public.users
       (name, email, plan, subscription_status, created_at)
     VALUES ($1, $2, 'free', 'inactive', NOW())
     RETURNING id`,
    [name, email],
  );

  return result.rows[0];
}

export async function findUserById(id: number) {
  const result = await pool.query("SELECT * FROM public.users WHERE id = $1", [
    id,
  ]);
  return result.rows[0];
}

export async function getMetrics() {
  const totalUsersRes = await pool.query("SELECT COUNT(*) FROM public.users;");

  const statusRes = await pool.query(`
    SELECT subscription_status, COUNT(*)
      FROM public.users
      GROUP BY subscription_status;
  `);

  const usersGrowthRes = await pool.query(`
    SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month, COUNT(*)
      FROM public.users
      GROUP BY month
      ORDER BY month;
  `);

  const subsGrowthRes = await pool.query(`
    SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month, COUNT(*)
      FROM public.users
      WHERE subscription_status = 'active'
      GROUP BY month
      ORDER BY month;
  `);

  const statusMap: Record<string, number> = {
    active: 0,
    trialing: 0,
    canceled: 0,
  };
  for (const row of statusRes.rows) {
    statusMap[row.subscription_status] = Number(row.count);
  }

  return {
    total_users: Number(totalUsersRes.rows[0].count),
    status: statusMap,
    users_growth: usersGrowthRes.rows.map((r) => ({
      month: r.month,
      count: Number(r.count),
    })),
    subscriptions_growth: subsGrowthRes.rows.map((r) => ({
      month: r.month,
      count: Number(r.count),
    })),
  };
}

export async function listUsers({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search: string;
}) {
  const offset = (page - 1) * limit;
  const params: string[] = [];
  let where = "";

  if (search) {
    params.push(`%${search}%`);
    where = `WHERE name ILIKE $${params.length} OR email ILIKE $${params.length}`;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM public.users ${where}`,
    params,
  );

  const usersResult = await pool.query(
    `SELECT id, name, email, plan, subscription_status, is_admin, created_at
       FROM public.users
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  return {
    total: Number(countResult.rows[0].count),
    page,
    limit,
    users: usersResult.rows,
  };
}

export async function toggleAdmin(userId: string) {
  const { rows } = await pool.query(
    `UPDATE public.users SET is_admin = NOT is_admin WHERE id = $1 RETURNING *`,
    [userId],
  );
  return rows[0];
}

export async function grantPremium(userId: string) {
  const { rows } = await pool.query(
    `UPDATE public.users
       SET plan = 'premium', subscription_status = 'active'
       WHERE id = $1 RETURNING *`,
    [userId],
  );
  return rows[0];
}

export async function revokePremium(userId: string) {
  const { rows } = await pool.query(
    `UPDATE public.users
       SET plan = 'free', subscription_status = 'inactive'
       WHERE id = $1 RETURNING *`,
    [userId],
  );
  return rows[0];
}

export async function getUser(userId: string) {
  const { rows } = await pool.query(
    `SELECT id, name, email, plan, subscription_status, is_admin, created_at
       FROM public.users WHERE id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}
