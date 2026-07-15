import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
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
  // Constant-length buffers for timing-safe comparison (pad/truncate to correct.length)
  const pwBuf = Buffer.alloc(correct.length);
  pwBuf.write(password.slice(0, correct.length));
  const correctBuf = Buffer.from(correct);
  const match = password.length === correct.length && timingSafeEqual(pwBuf, correctBuf);
  if (!match) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  setAdminCookie(res);
  return res;
}
