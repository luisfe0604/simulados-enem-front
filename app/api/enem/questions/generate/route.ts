import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { requireActiveSubscription } from "@/lib/authz";
import { generateQuestions } from "@/lib/services/enem";

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    await requireActiveSubscription();
    const { searchParams } = req.nextUrl;
    const questions = await generateQuestions({
      subject_id: searchParams.get("subject_id"),
      limit: searchParams.get("limit"),
      difficulty: searchParams.get("difficulty"),
    });
    return NextResponse.json(questions);
  });
}
