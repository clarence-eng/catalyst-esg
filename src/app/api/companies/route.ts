import { NextResponse } from "next/server";
import { fetchCompaniesFromSupabase } from "@/lib/fetchCompanies";
import { companies as staticCompanies } from "@/data/companies";

export async function GET() {
  // Cache-Control uses 'private' — portfolio data includes IC recommendations, investment values,
  // and board composition; shared CDN caching would expose internal data to other users.
  // Short TTL: 30s fresh, 5min stale-while-revalidate under the private/browser-only directive.
  const liveCache = { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=300" } };
  const noCache = { headers: { "Cache-Control": "no-store" } };
  try {
    const dbCompanies = await fetchCompaniesFromSupabase();
    if (dbCompanies.length > 0) {
      // Detect partial results: if every company has 0 engagements the child query likely failed.
      // Serve without caching so the next request retries rather than serving stale empty alerts.
      const hasAnyEngagements = dbCompanies.some(c => c.engagement.length > 0);
      const isLikelyPartial = !hasAnyEngagements && dbCompanies.length > 0;
      return NextResponse.json(
        { source: "supabase", companies: dbCompanies },
        isLikelyPartial ? noCache : liveCache
      );
    }
    // Fall back to static data — private cache since it still contains internal IC data
    return NextResponse.json({ source: "static", companies: staticCompanies }, { headers: { "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ source: "static", companies: staticCompanies }, noCache);
  }
}
