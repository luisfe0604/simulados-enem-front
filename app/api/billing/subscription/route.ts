import { NextResponse } from "next/server";
import { handleRoute, notFound } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { getSubscriptionStatus } from "@/lib/services/billing";

export async function GET() {
  return handleRoute(async () => {
    const userId = await requireUserId();
    try {
      const data = await getSubscriptionStatus(userId);
      return NextResponse.json(data);
    } catch (err) {
      if (err instanceof Error && err.message === "USER_NOT_FOUND") {
        return notFound("Usuário não encontrado");
      }
      throw err;
    }
  });
}
