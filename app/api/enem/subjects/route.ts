import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { requireActiveSubscription } from "@/lib/authz";
import { getSubjects } from "@/lib/services/enem";

export async function GET() {
  return handleRoute(async () => {
    await requireActiveSubscription();
    const subjects = await getSubjects();
    return NextResponse.json(subjects);
  });
}
