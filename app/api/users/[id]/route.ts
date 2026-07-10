import { NextResponse } from "next/server";
import { handleRoute, notFound } from "@/lib/api";
import { requireAdmin } from "@/lib/authz";
import { getUser } from "@/lib/services/users";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    await requireAdmin();
    const { id } = await params;

    const user = await getUser(id);
    if (!user) return notFound("Usuário não encontrado");

    return NextResponse.json(user);
  });
}
