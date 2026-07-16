import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { setAdminCookie } from "@/lib/adminAuth";

// Fixed-length buffer size for timing-safe comparison — larger than any realistic password.
// Using a fixed pad length hides the true password length from timing analysis.
const CMP_LEN = 256;

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
  // Pad both to CMP_LEN before comparing so that the branch on password.length === correct.length
  // does not leak the correct password length via timing. timingSafeEqual always runs.
  const pwBuf = Buffer.alloc(CMP_LEN);
  pwBuf.write(password.slice(0, CMP_LEN));
  const correctBuf = Buffer.alloc(CMP_LEN);
  correctBuf.write(correct.slice(0, CMP_LEN));
  // Also compare lengths using a constant-time XOR so a wrong length still runs the full compare.
  const lengthMatch = Buffer.from([password.length === correct.length ? 1 : 0]);
  const lengthOk = timingSafeEqual(lengthMatch, Buffer.from([1]));
  const contentMatch = timingSafeEqual(pwBuf, correctBuf);
  if (!(lengthOk && contentMatch)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  setAdminCookie(res);
  return res;
}
