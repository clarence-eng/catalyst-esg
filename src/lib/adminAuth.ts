import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { type NextResponse } from "next/server";

export const ADMIN_COOKIE = "catalyst_admin_tok";

// Token rotates every hour: HMAC(password, "catalyst-admin-session-v1:<hour-bucket>")
// A captured cookie is invalid as soon as the hour flips — maxAge on the client is 8 h
// but the server will accept at most the current and one trailing hour (handles clock skew
// near the boundary) and never further back.
function hourBucket(offsetHours = 0): string {
  // integer hours since unix epoch — changes every 60 min
  return String(Math.floor((Date.now() / 1_000 / 3_600)) + offsetHours);
}

function computeToken(bucket: string): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD env var is not set");
  return createHmac("sha256", pw).update(`catalyst-admin-session-v1:${bucket}`).digest("hex");
}

export function setAdminCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_COOKIE, computeToken(hourBucket()), {
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
    const tokenBuf = Buffer.from(token, "hex");
    // Accept current hour and the immediately prior hour (handles boundary clock skew)
    for (const offset of [0, -1]) {
      const expected = Buffer.from(computeToken(hourBucket(offset)), "hex");
      if (timingSafeEqual(tokenBuf, expected)) return true;
    }
    return false;
  } catch {
    return false;
  }
}
