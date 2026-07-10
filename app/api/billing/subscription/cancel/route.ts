import { NextResponse } from "next/server";
import { handleRoute, notFound } from "@/lib/api";
import { requireUserId } from "@/lib/session";
import { cancelSubscription } from "@/lib/services/billing";

export async function POST() {
  return handleRoute(async () => {
    const userId = await requireUserId();
    try {
      const result = await cancelSubscription(userId);
      return NextResponse.json(result);
    } catch (err) {
      if (err instanceof Error && err.message === "SUBSCRIPTION_NOT_FOUND") {
        return notFound("Assinatura não encontrada");
      }
      throw err;
    }
  });
}
