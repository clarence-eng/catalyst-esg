import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { setAdminCookie } from "@/lib/adminAuth";

// Fixed-length buffer size for timing-safe comparison — larger than any realistic password.
// Using a fixed pad length hides the true password length from timing analysis.
const CMP_LEN = 256;

// Strict rate limiter for login — 10 attempts per minute per IP.
// Stricter than the write-route limiter (30/min) since login is the primary brute-force target.
const loginRateMap = new Map<string, { count: number; reset: number }>();
const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_WINDOW_MS = 60_000;

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginRateMap.get(ip);
  if (!entry || now > entry.reset) {
    loginRateMap.set(ip, { count: 1, reset: now + LOGIN_RATE_WINDOW_MS });
    if (loginRateMap.size > 200) {
      let deleted = 0;
      for (const [k, v] of loginRateMap) { if (now > v.reset) { loginRateMap.delete(k); deleted++; } }
      // Hard cap: if no expired entries found, trim oldest 100 to bound memory
      if (deleted === 0 && loginRateMap.size > 400) {
        let i = 0;
        for (const k of loginRateMap.keys()) { if (i++ >= 100) break; loginRateMap.delete(k); }
      }
    }
    return true;
  }
  if (entry.count >= LOGIN_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json({ error: "Too many login attempts — please wait before retrying" }, { status: 429 });
  }

  const correct = process.env.ADMIN_PASSWORD;
  if (!correct) {
    return NextResponse.json({ error: "Admin access not configured — contact your administrator" }, { status: 503 });
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
