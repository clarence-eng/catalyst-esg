import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { type NextResponse } from "next/server";

export const ADMIN_COOKIE = "catalyst_admin_tok";

function computeToken(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD env var is not set");
  // HMAC-SHA256(key=password, message=fixed-string) produces a deterministic token.
  // This means: (1) the token is valid until ADMIN_PASSWORD is rotated regardless of
  // logout — a captured cookie value remains exploitable; (2) no per-session uniqueness.
  // For production: replace with a random nonce stored server-side (Redis/DB) and deleted on logout.
  return createHmac("sha256", pw).update("catalyst-admin-session-v1").digest("hex");
}

export function setAdminCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_COOKIE, computeToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function clearAdminCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function verifyAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE)?.value ?? "";
  if (token.length !== 64) return false;
  try {
    const expected = computeToken();
    return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
