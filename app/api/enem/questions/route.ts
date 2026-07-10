import { NextRequest, NextResponse } from "next/server";
import { handleRoute, badRequest } from "@/lib/api";
import { requireActiveSubscription } from "@/lib/authz";
import { createQuestion } from "@/lib/services/enem";

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    await requireActiveSubscription();
    const body = await req.json();

    const { statement, option_a, option_b, option_c, correct_option } = body;
    if (!statement || !option_a || !option_b || !option_c || !correct_option) {
      return badRequest("Campos obrigatórios faltando");
    }

    const question = await createQuestion(body);
    return NextResponse.json(question, { status: 201 });
  });
}
