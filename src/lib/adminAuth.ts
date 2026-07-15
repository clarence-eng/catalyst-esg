import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import { type NextResponse } from "next/server";

export const ADMIN_COOKIE = "catalyst_admin_tok";

function computeToken(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "catalyst2026";
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

export function verifyAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE)?.value ?? "";
  return token.length === 64 && token === computeToken();
}
