import { NextRequest, NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const correct = process.env.ADMIN_PASSWORD;
  if (!correct) {
    return NextResponse.json({ error: "Admin access not configured — set ADMIN_PASSWORD in environment variables" }, { status: 503 });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { password } = (body as Record<string, unknown>) ?? {};
  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Missing password" }, { status: 400 });
  }
  if (password !== correct) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  setAdminCookie(res);
  return res;
}
