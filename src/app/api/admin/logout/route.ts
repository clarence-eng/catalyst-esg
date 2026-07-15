import { NextRequest, NextResponse } from "next/server";
import { clearAdminCookie, verifyAdminRequest } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  // Verify admin cookie before clearing it — prevents CSRF force-logout attacks.
  // SameSite=Strict blocks the cookie from being sent cross-site, but the browser
  // would still apply a Set-Cookie: maxAge=0 response from a cross-site POST.
  // An unauthenticated caller gets an empty 200 (idempotent: clearing an absent cookie is fine).
  if (!verifyAdminRequest(req)) {
    return NextResponse.json({ ok: true });
  }
  const res = NextResponse.json({ ok: true });
  clearAdminCookie(res);
  return res;
}
