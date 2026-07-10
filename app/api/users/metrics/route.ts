import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { requireAdmin } from "@/lib/authz";
import { getMetrics } from "@/lib/services/users";

export async function GET() {
  return handleRoute(async () => {
    await requireAdmin();
    const data = await getMetrics();
    return NextResponse.json(data);
  });
}
