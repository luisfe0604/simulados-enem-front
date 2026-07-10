import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { requireAdmin } from "@/lib/authz";
import { getExams } from "@/lib/services/enem";

// No backend, /enem/exams exige admin (usado na tela de cadastro de questão).
export async function GET() {
  return handleRoute(async () => {
    await requireAdmin();
    const exams = await getExams();
    return NextResponse.json(exams);
  });
}
