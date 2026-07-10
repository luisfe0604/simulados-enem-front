import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { findUserById } from "@/lib/services/users";

export async function GET() {
  return handleRoute(async () => {
    const userId = await requireUserId();
    const user = await findUserById(userId);

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Nunca vazar o hash da senha para o cliente
    const { password_hash: _ph, ...safeUser } = user;
    void _ph;
    return NextResponse.json(safeUser);
  });
}
