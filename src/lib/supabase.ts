import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton — deferred until first use so missing env vars throw inside
// a route handler (where the error is caught) rather than at module load time
// (which would crash the entire serverless function before any catch fires).
let _client: SupabaseClient | null = null;
let _adminClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

// Admin client — uses service_role key which bypasses RLS.
// MUST only be used in server-side route handlers, never in client components.
// Does NOT cache the fallback anon client — each call re-checks the env var so that
// a container that starts without SUPABASE_SERVICE_ROLE_KEY picks it up on next request
// once it is injected, rather than permanently serving admin writes with the anon key.
export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured");
  if (!serviceKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required in production for secure admin writes");
    }
    console.warn("[Supabase] SUPABASE_SERVICE_ROLE_KEY not set — falling back to anon key. Set this env var in production.");
    return getSupabaseClient();
  }
  // Cache the real admin client (service_role key) for performance
  if (_adminClient) return _adminClient;
  _adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  return _adminClient;
}

// Convenience proxy — same API as before for code that imports `supabase` directly.
// Callers inside try/catch (route handlers, fetchCompaniesFromSupabase) are safe.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return (getSupabaseClient() as unknown as Record<string, unknown>)[prop as string];
  },
});

export type DbCompany = {
  id: string;
  slug: string | null;
  name: string | null;
  sector: string | null;
  country: string | null;
  region: string | null;
  description: string | null;
  portfolio_status: "Active" | "Pipeline" | null;
  maturity: "Leading" | "Advanced" | "Developing" | "Lagging" | null;
  investment_value: number | null;
  carbon_intensity: number | null;
  green_revenue_pct: number | null;
  esg_overall: number | null;
  esg_environmental: number | null;
  esg_social: number | null;
  esg_governance: number | null;
  esg_rating: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | string | null;
  transition_risk: "Low" | "Medium" | "High" | "Critical" | null;
  physical_risk: "Low" | "Medium" | "High" | "Critical" | null;
  pathway_alignment: "1.5°C" | "2°C" | "3°C+" | "Not assessed" | null;
  nature_risk: "Low" | "Medium" | "High" | "Critical" | null;
  net_zero_commitment: "None" | "Net Zero Pledged" | "SBTi Committed" | "SBTi Targets Set" | null;
  sasb_category: string | null;
  temasek_megatrend: string | null;
  last_updated: string | null;
  created_at: string;
};

export type DbEngagement = {
  id: string;
  company_slug: string;
  date: string;
  type: "Meeting" | "Report Review" | "Site Visit" | "Call" | "Email" | string;
  topic: string;
  status: "Completed" | "Planned" | "Overdue";
  notes: string;
  created_at: string;
};

export type DbMaterialIssue = {
  id: string;
  company_slug: string;
  issue: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  category: "Environmental" | "Social" | "Governance";
  opportunity: boolean;
  detail: string;
  sort_order: number | null;
  created_at: string;
};
