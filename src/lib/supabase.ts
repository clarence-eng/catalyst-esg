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
  _client = createClient(url, key);
  return _client;
}

// Admin client — uses service_role key which bypasses RLS.
// MUST only be used in server-side route handlers, never in client components.
// Falls back to anon key with a warning if SUPABASE_SERVICE_ROLE_KEY is not set
// (acceptable in local dev; required in production for secure write operations).
export function getSupabaseAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured");
  if (!serviceKey) {
    console.warn("[Supabase] SUPABASE_SERVICE_ROLE_KEY not set — falling back to anon key for admin writes. Set this env var in production.");
    return getSupabaseClient();
  }
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
  slug: string;
  name: string;
  sector: string;
  country: string;
  region: string;
  description: string;
  portfolio_status: "Active" | "Pipeline";
  maturity: "Leading" | "Advanced" | "Developing" | "Lagging";
  investment_value: number;
  carbon_intensity: number;
  green_revenue_pct: number;
  esg_overall: number;
  esg_environmental: number;
  esg_social: number;
  esg_governance: number;
  esg_rating: string;
  transition_risk: "Low" | "Medium" | "High" | "Critical";
  physical_risk: "Low" | "Medium" | "High" | "Critical";
  pathway_alignment: "1.5°C" | "2°C" | "3°C+" | "Not assessed";
  nature_risk: "Low" | "Medium" | "High" | "Critical";
  net_zero_commitment: "None" | "Net Zero Pledged" | "SBTi Committed" | "SBTi Targets Set";
  sasb_category: string;
  temasek_megatrend: string;
  last_updated: string;
  created_at: string;
};

export type DbEngagement = {
  id: string;
  company_slug: string;
  date: string;
  type: string;
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
  sort_order: number;
  created_at: string;
};
