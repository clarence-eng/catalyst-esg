/**
 * Fetches all companies from Supabase and converts to the Company type.
 * Falls back to empty array if Supabase is unavailable.
 */

import { supabase, type DbCompany, type DbEngagement, type DbMaterialIssue } from "./supabase";
import type { Company } from "@/data/companies";
import { getCompanyBySlug } from "@/data/companies";

function dbToCompany(
  co: DbCompany,
  engagements: DbEngagement[],
  issues: DbMaterialIssue[]
): Company {
  // Use static data as a reference for fields not stored in DB
  const staticRef = getCompanyBySlug(co.slug);

  // Derive nature risk flags from sector and nature_risk level
  const sector = co.sector.toLowerCase();
  const isAgri = sector.includes("agri") || sector.includes("palm") || sector.includes("agriculture");
  const isMarine = sector.includes("marine") || sector.includes("shipping");
  const natureLevel = co.nature_risk as string;
  const isHighNature = natureLevel === "Critical" || natureLevel === "High";

  // Derive transition context from transition_risk level
  const transitionLevel = co.transition_risk as string;
  const transitionDetails = transitionLevel === "Critical" ? [
    "Significant carbon pricing exposure as regulations tighten",
    "Stranded asset risk from fossil fuel dependency",
    "Paris-misaligned pathway requires urgent strategy revision",
  ] : transitionLevel === "High" ? [
    "Moderate carbon pricing exposure in operating markets",
    "Technology transition investment required for decarbonisation",
  ] : transitionLevel === "Medium" ? [
    "Some exposure to transition policies; monitoring required",
  ] : [];

  const physicalDetails = (natureLevel === "Critical" || natureLevel === "High" || transitionLevel === "High" || transitionLevel === "Critical") ? [
    "Operational exposure to climate-related physical risks in operating region",
  ] : [];

  // Board composition: use static data if available, otherwise estimate from governance score
  const board = staticRef?.boardComposition || {
    boardSize: 8,
    independentPct: co.esg_governance >= 65 ? 56 : co.esg_governance >= 50 ? 44 : 38,
    womenPct: co.esg_governance >= 70 ? 33 : 25,
    ceoChairSplit: co.esg_governance >= 60,
    auditCommittee: co.esg_governance >= 50,
    esgCommittee: co.esg_governance >= 70,
  };

  // Value uplift: use static data if available, else generate from sector
  const valueUplift = staticRef?.valueUplift || [];

  // SDG alignment: use static data if available
  const sdgAlignment = staticRef?.sdgAlignment || [];

  return {
    slug: co.slug,
    name: co.name,
    sector: co.sector,
    country: co.country,
    region: co.region,
    description: co.description,
    portfolioStatus: co.portfolio_status as Company["portfolioStatus"],
    maturity: co.maturity as Company["maturity"],
    investmentValue: co.investment_value,
    carbonIntensity: co.carbon_intensity,
    greenRevenuePct: co.green_revenue_pct,
    esgScore: {
      overall: co.esg_overall,
      environmental: co.esg_environmental,
      social: co.esg_social,
      governance: co.esg_governance,
      rating: co.esg_rating as Company["esgScore"]["rating"],
    },
    climateRisk: {
      transition: co.transition_risk as Company["climateRisk"]["transition"],
      physical: co.physical_risk as Company["climateRisk"]["physical"],
      pathwayAlignment: co.pathway_alignment as Company["climateRisk"]["pathwayAlignment"],
      transitionDetails,
      physicalDetails,
    },
    natureRisk: {
      overall: co.nature_risk as Company["natureRisk"]["overall"],
      biodiversityExposure: isHighNature && (isAgri || isMarine),
      waterStress: isHighNature && isAgri,
      deforestationRisk: isAgri && isHighNature,
      tnfdAligned: false,
      details: isHighNature ? [
        `Nature risk level: ${co.nature_risk}. TNFD assessment recommended.`,
      ] : [],
      tnfdPillars: staticRef?.natureRisk.tnfdPillars || [
        { pillar: "Governance", status: "Gap" },
        { pillar: "Strategy", status: "Gap" },
        { pillar: "Risk & Impact Mgmt", status: "Gap" },
        { pillar: "Metrics & Targets", status: "Gap" },
      ],
    },
    netZeroCommitment: co.net_zero_commitment as Company["netZeroCommitment"],
    sasbCategory: co.sasb_category,
    temasekMegatrend: co.temasek_megatrend as Company["temasekMegatrend"],
    lastUpdated: co.last_updated,
    // Map engagements
    engagement: engagements
      .filter(e => e.company_slug === co.slug)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(e => ({
        date: e.date,
        type: e.type as Company["engagement"][0]["type"],
        topic: e.topic,
        status: e.status as Company["engagement"][0]["status"],
        notes: e.notes,
      })),
    // Map material issues
    materialIssues: issues
      .filter(i => i.company_slug === co.slug)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(i => ({
        category: i.category as Company["materialIssues"][0]["category"],
        issue: i.issue,
        severity: i.severity as Company["materialIssues"][0]["severity"],
        opportunity: i.opportunity,
        detail: i.detail,
      })),
    // historicalScores: Q2=current, Q1=prior quarter (offset to show realistic trend)
    historicalScores: staticRef?.historicalScores || [
      { period: "Q1 2026", e: Math.max(0, co.esg_environmental - 2), s: Math.max(0, co.esg_social - 1), g: Math.max(0, co.esg_governance - 2) },
      { period: "Q2 2026", e: co.esg_environmental, s: co.esg_social, g: co.esg_governance },
    ],
    boardComposition: board,
    valueUplift,
    sdgAlignment,
    icRecommendation: staticRef?.icRecommendation,
  };
}

let cachedCompanies: Company[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 30_000; // 30 second cache

export async function fetchCompaniesFromSupabase(): Promise<Company[]> {
  // Return cache if fresh
  if (cachedCompanies && Date.now() - cacheTime < CACHE_TTL) {
    return cachedCompanies;
  }

  try {
    const [
      { data: cos, error: cosErr },
      { data: engs, error: engsErr },
      { data: mis, error: misErr }
    ] = await Promise.all([
      supabase.from("companies").select("*").order("created_at"),
      supabase.from("engagements").select("*").order("date", { ascending: false }),
      supabase.from("material_issues").select("*").order("sort_order"),
    ]);
    if (cosErr) console.warn("[Supabase] companies error:", cosErr.message);
    if (engsErr) console.warn("[Supabase] engagements error:", engsErr.message);
    if (misErr) console.warn("[Supabase] material_issues error:", misErr.message);

    if (!cos || cos.length === 0) return [];

    const companies: Company[] = [];
    for (const co of cos as DbCompany[]) {
      try {
        companies.push(dbToCompany(co, (engs || []) as DbEngagement[], (mis || []) as DbMaterialIssue[]));
      } catch (err) {
        console.warn("[Supabase] skipping malformed company row:", co.slug, err);
      }
    }

    cachedCompanies = companies;
    cacheTime = Date.now();
    return companies;
  } catch {
    return [];
  }
}

export function clearCompanyCache() {
  cachedCompanies = null;
  cacheTime = 0;
}
