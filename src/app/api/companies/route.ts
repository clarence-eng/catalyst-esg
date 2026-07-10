import { NextResponse } from "next/server";
import { fetchCompaniesFromSupabase } from "@/lib/fetchCompanies";
import { companies as staticCompanies } from "@/data/companies";

export async function GET() {
  try {
    // Try Supabase first
    const dbCompanies = await fetchCompaniesFromSupabase();
    if (dbCompanies.length > 0) {
      return NextResponse.json({ source: "supabase", companies: dbCompanies });
    }
    // Fall back to static data
    return NextResponse.json({ source: "static", companies: staticCompanies });
  } catch {
    return NextResponse.json({ source: "static", companies: staticCompanies });
  }
}
