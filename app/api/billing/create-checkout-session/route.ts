import { NextRequest, NextResponse } from "next/server";
import { handleRoute, notFound } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { findUserById } from "@/lib/services/users";
import { createCheckoutSession } from "@/lib/services/billing";

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const userId = await requireUserId();
    const user = await findUserById(userId);
    if (!user) return notFound("Usuário não encontrado");

    const { url } = await createCheckoutSession(
      { id: user.id, email: user.email },
      req.nextUrl.origin,
    );
    return NextResponse.json({ url });
  });
}
