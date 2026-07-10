import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
