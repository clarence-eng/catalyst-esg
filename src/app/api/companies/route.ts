import { NextResponse } from "next/server";
import { fetchCompaniesFromSupabase } from "@/lib/fetchCompanies";
import { companies as staticCompanies } from "@/data/companies";

export async function GET() {
  const noCache = { headers: { "Cache-Control": "no-store" } };
  try {
    // Try Supabase first
    const dbCompanies = await fetchCompaniesFromSupabase();
    if (dbCompanies.length > 0) {
      return NextResponse.json({ source: "supabase", companies: dbCompanies }, noCache);
    }
    // Fall back to static data
    return NextResponse.json({ source: "static", companies: staticCompanies }, noCache);
  } catch {
    return NextResponse.json({ source: "static", companies: staticCompanies }, noCache);
  }
}
