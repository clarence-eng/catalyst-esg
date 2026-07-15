import { NextResponse } from "next/server";
import { fetchCompaniesFromSupabase } from "@/lib/fetchCompanies";
import { companies as staticCompanies } from "@/data/companies";

export async function GET() {
  // Short CDN/edge cache: 30s fresh, 5min stale-while-revalidate — cuts Supabase reads ~95%
  // under concurrent load without meaningfully staling portfolio data that changes at most daily.
  const liveCache = { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } };
  const noCache = { headers: { "Cache-Control": "no-store" } };
  try {
    // Try Supabase first
    const dbCompanies = await fetchCompaniesFromSupabase();
    if (dbCompanies.length > 0) {
      return NextResponse.json({ source: "supabase", companies: dbCompanies }, liveCache);
    }
    // Fall back to static data — cache longer since it never changes
    return NextResponse.json({ source: "static", companies: staticCompanies }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ source: "static", companies: staticCompanies }, noCache);
  }
}
