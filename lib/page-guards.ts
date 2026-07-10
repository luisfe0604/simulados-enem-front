import { redirect } from "next/navigation";
import pool from "./db";
import { getSession } from "./session";

// Guard de autorização para páginas admin (server components). Ao contrário do
// AdminRoute client-side antigo (que só escondia a UI), aqui a checagem roda no
// servidor e redireciona antes de renderizar — o middleware/proxy já garantiu a
// autenticação; aqui conferimos is_admin no banco.
export async function requireAdminPage(): Promise<number> {
  const session = await getSession();
  if (!session) redirect("/login");

  const { rows } = await pool.query<{ is_admin: boolean }>(
    "SELECT is_admin FROM public.users WHERE id = $1",
    [session.userId],
  );

  if (!rows[0]?.is_admin) redirect("/");

  return session.userId;
}
