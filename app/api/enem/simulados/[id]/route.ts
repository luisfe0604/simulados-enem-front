import { NextResponse } from "next/server";
import { handleRoute, notFound } from "@/lib/api";
import { requireActiveSubscription } from "@/lib/authz";
import { getSimuladoById } from "@/lib/services/enem";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const userId = await requireActiveSubscription();
    const { id } = await params;

    const result = await getSimuladoById({ userId, simulatedId: id });
    if (!result) return notFound("Simulado não encontrado");

    return NextResponse.json(result);
  });
}
