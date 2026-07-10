import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { requireAdmin } from "@/lib/authz";
import { toggleAdmin } from "@/lib/services/users";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const data = await toggleAdmin(id);
    return NextResponse.json(data);
  });
}
