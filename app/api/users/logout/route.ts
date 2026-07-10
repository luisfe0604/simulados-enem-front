import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  return handleRoute(async () => {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  });
}
