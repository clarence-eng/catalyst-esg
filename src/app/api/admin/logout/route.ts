import { NextRequest, NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/adminAuth";

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  clearAdminCookie(res);
  return res;
}
