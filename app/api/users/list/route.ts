import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { requireAdmin } from "@/lib/authz";
import { listUsers } from "@/lib/services/users";

export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    await requireAdmin();

    const { searchParams } = req.nextUrl;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const search = searchParams.get("search") || "";

    const data = await listUsers({ page, limit, search });
    return NextResponse.json(data);
  });
}
