/**
 * Fetches all companies from Supabase and converts to the Company type.
 * Falls back to empty array if Supabase is unavailable.
 *
 * NOTE: Enrichment data is inlined below to avoid cross-module import issues
 * in the Vercel serverless environment where dynamic require/import resolution
 * of @/ aliases can fail at runtime.
 */

import { supabase, type DbCompany, type DbEngagement, type DbMaterialIssue } from "./supabase";
import type { Company } from "@/data/companies";

// ---------------------------------------------------------------------------
// Inline enrichment map — fields that are NOT stored in Supabase
// (natureRisk booleans, climateRisk details, historical scores, board, etc.)
// ---------------------------------------------------------------------------
type EnrichmentEntry = {
  natureRisk: {
    biodiversityExposure: boolean;
    waterStress: boolean;
    deforestationRisk: boolean;
    tnfdAligned: boolean;
    details: string[];
  };
  climateRisk: {
    transitionDetails: string[];
    physicalDetails: string[];
  };
  boardComposition: Company["boardComposition"];
  historicalScores: Company["historicalScores"];
  sdgAlignment: Company["sdgAlignment"];
  valueUplift: Company["valueUplift"];
  tnfdPillars: Company["natureRisk"]["tnfdPillars"];
  icRecommendation?: Company["icRecommendation"];
};

const ENRICHMENT: Record<string, EnrichmentEntry> = {
  "seaport-logistics": {
    natureRisk: {
      biodiversityExposure: true, waterStress: false, deforestationRisk: false, tnfdAligned: false,      details: [
        "Dredging operations at two port expansion sites may impact marine biodiversity",
        "Ballast water management compliance with IMO BWM Convention required across aging fleet",
      ],
    },
    climateRisk: {
      transitionDetails: [
        "Fleet of 120+ vessels predominantly HFO-powered, facing IMO 2030 carbon intensity regulations",
        "EU ETS expansion to shipping from 2024 increases operating costs by est. 8-12%",
        "Customer Scope 3 reduction targets creating pressure to offer low-emission freight options",
      ],
      physicalDetails: [
        "Port infrastructure exposed to rising sea levels across Singapore, Vietnam, and Indonesia terminals",
        "Increased storm surge frequency threatens terminal operations in Gulf of Thailand",
        "Heat stress impacts on dock worker productivity and equipment performance",
      ],
    },
    boardComposition: { boardSize: 9, independentPct: 44, womenPct: 22, ceoChairSplit: true, auditCommittee: true, esgCommittee: false },
    historicalScores: [
      { period: "Q1 2024", e: 35, s: 55, g: 50 },
      { period: "Q2 2024", e: 33, s: 57, g: 52 },
      { period: "Q3 2024", e: 36, s: 59, g: 53 },
      { period: "Q4 2024", e: 39, s: 60, g: 55 },
      { period: "Q1 2025", e: 41, s: 61, g: 58 },
      { period: "Q2 2025", e: 40, s: 62, g: 60 },
      { period: "Q3 2025", e: 42, s: 63, g: 61 },
      { period: "Q4 2025", e: 40, s: 60, g: 57 },
      { period: "Q1 2026", e: 41, s: 61, g: 58 },
      { period: "Q2 2026", e: 41, s: 62, g: 59 },
    ],
    sdgAlignment: [
      { sdg: 13, label: "Climate Action" },
      { sdg: 14, label: "Life Below Water" },
    ],
    valueUplift: [
      { area: "Green Fleet Transition", potential: "High", description: "Methanol-ready vessel retrofits unlock ESG-linked financing at 40-80bps lower cost. IFC and ADB green shipping facilities available." },
      { area: "Carbon-Labelled Freight", potential: "Medium", description: "Launch verified low-emission freight tier (LNG/methanol). Customer willingness-to-pay premium est. 5-8% among MNC shippers with Scope 3 targets." },
      { area: "Port Electrification", potential: "Medium", description: "Solar + shore power at Singapore terminal reduces grid electricity costs by 30% and unlocks BCA Green Mark certification." },
    ],
    tnfdPillars: [
      { pillar: "Governance", status: "Partial" },
      { pillar: "Strategy", status: "Gap" },
      { pillar: "Risk & Impact Mgmt", status: "Gap" },
      { pillar: "Metrics & Targets", status: "Gap" },
    ],
  },

  "nusantara-bank": {
    natureRisk: {
      biodiversityExposure: true, waterStress: false, deforestationRisk: true, tnfdAligned: false,      details: [
        "Palm oil and timber sector lending (~8% of book) exposed to EUDR deforestation regulation compliance risk",
        "No TNFD assessment conducted; forest-risk commodity exposure unquantified",
        "ESG screening for new agriculture lending introduced in 2024 but lacks deforestation-free verification",
      ],
    },
    climateRisk: {
      transitionDetails: [
        "22% of corporate loan book in carbon-intensive sectors (coal, palm oil, cement)",
        "Indonesia coal phase-out under JETP creates credit risk for mining and power sector clients",
        "OJK (Indonesia FSA) mandatory climate risk disclosure requirements effective 2025",
      ],
      physicalDetails: [
        "Loan book exposure to agriculture and real estate in flood-prone Kalimantan and coastal Java",
        "Physical damage risk to collateral assets estimated at 6-9% of secured loan book by 2040",
      ],
    },
    boardComposition: { boardSize: 8, independentPct: 50, womenPct: 25, ceoChairSplit: true, auditCommittee: true, esgCommittee: true },
    historicalScores: [
      { period: "Q1 2024", e: 48, s: 62, g: 65 },
      { period: "Q2 2024", e: 50, s: 63, g: 62 },
      { period: "Q3 2024", e: 52, s: 65, g: 67 },
      { period: "Q4 2024", e: 53, s: 67, g: 70 },
      { period: "Q1 2025", e: 55, s: 68, g: 72 },
      { period: "Q2 2025", e: 57, s: 69, g: 73 },
      { period: "Q3 2025", e: 56, s: 70, g: 74 },
      { period: "Q4 2025", e: 54, s: 67, g: 71 },
      { period: "Q1 2026", e: 55, s: 68, g: 72 },
      { period: "Q2 2026", e: 55, s: 69, g: 72 },
    ],
    sdgAlignment: [
      { sdg: 8, label: "Decent Work" },
      { sdg: 10, label: "Reduced Inequalities" },
      { sdg: 13, label: "Climate Action" },
    ],
    valueUplift: [
      { area: "JETP Transition Finance", potential: "High", description: "Indonesia's $20B JETP creates demand for transition finance products. Position bank as preferred arranger for coal-to-renewables refinancing." },
      { area: "Nature-Positive Lending Policy", potential: "High", description: "Adopt TNFD-aligned forest-risk commodity policy to de-risk EUDR exposure and unlock HSBC/IFC co-lending partnerships." },
      { area: "Digital Inclusive Finance", potential: "Medium", description: "ESG-linked digital credit products for unbanked SMEs. Blended finance available via ADB Digital Finance Facility." },
    ],
    tnfdPillars: [
      { pillar: "Governance", status: "Partial" },
      { pillar: "Strategy", status: "Partial" },
      { pillar: "Risk & Impact Mgmt", status: "Gap" },
      { pillar: "Metrics & Targets", status: "Gap" },
    ],
  },

  "cloudmesh-technologies": {
    natureRisk: {
      biodiversityExposure: false, waterStress: true, deforestationRisk: false, tnfdAligned: false,      details: [
        "Data centre water consumption for cooling is material; Singapore faces long-term freshwater constraints",
        "Water Usage Effectiveness (WUE) metric not publicly disclosed",
      ],
    },
    climateRisk: {
      transitionDetails: [
        "Singapore grid still ~95% natural gas; Scope 2 emissions material until regional grid decarbonises",
        "Customers increasingly requiring sustainability reporting on cloud workloads under ISSB S2",
        "EU AI Act and MAS Model AI Governance Framework adding compliance costs for AI product lines",
      ],
      physicalDetails: [
        "Singapore data centre cooling demand increases with rising ambient temperatures (est. +8% energy per 1°C ambient increase)",
        "Limited physical risk given hardened data centre infrastructure",
      ],
    },
    boardComposition: { boardSize: 7, independentPct: 57, womenPct: 29, ceoChairSplit: true, auditCommittee: true, esgCommittee: true },
    historicalScores: [
      { period: "Q1 2024", e: 55, s: 68, g: 72 },
      { period: "Q2 2024", e: 57, s: 70, g: 74 },
      { period: "Q3 2024", e: 60, s: 70, g: 75 },
      { period: "Q4 2024", e: 62, s: 72, g: 77 },
      { period: "Q1 2025", e: 63, s: 74, g: 78 },
      { period: "Q2 2025", e: 65, s: 75, g: 79 },
      { period: "Q3 2025", e: 67, s: 76, g: 80 },
      { period: "Q4 2025", e: 62, s: 73, g: 77 },
      { period: "Q1 2026", e: 63, s: 74, g: 78 },
      { period: "Q2 2026", e: 63, s: 74, g: 79 },
    ],
    sdgAlignment: [
      { sdg: 9, label: "Industry & Innovation" },
      { sdg: 13, label: "Climate Action" },
    ],
    valueUplift: [
      { area: "Green Data Centre Certification", potential: "High", description: "BCA Green Mark Platinum for Singapore DC + 100% renewable energy claim via I-REC unlocks premium pricing with ESG-conscious enterprise clients (10-15% willingness-to-pay premium)." },
      { area: "Responsible AI Framework", potential: "Medium", description: "Publish MAS FEAT-aligned AI governance framework. Differentiator for financial services clients facing AI regulatory scrutiny." },
      { area: "Sustainability Analytics Product", potential: "High", description: "Embed carbon accounting into cloud billing dashboard. ISSB S2 reporting requirement creates $2B+ APAC market for enterprise carbon management SaaS." },
    ],
    tnfdPillars: [
      { pillar: "Governance", status: "Partial" },
      { pillar: "Strategy", status: "Partial" },
      { pillar: "Risk & Impact Mgmt", status: "Gap" },
      { pillar: "Metrics & Targets", status: "Gap" },
    ],
  },

  "greenharvest-agri": {
    natureRisk: {
      biodiversityExposure: true, waterStress: true, deforestationRisk: true, tnfdAligned: false,      details: [
        "Operations adjacent to Maliau Basin Conservation Area (Sabah's 'Lost World'); buffer zone management is critical",
        "High Conservation Value (HCV) assessments completed for 80% of landbank, 20% pending",
        "TNFD LEAP assessment (phases L-A) completed Q3 2025 — one of first agribusiness companies in ASEAN to complete TNFD LEAP Risk Assessment phase. Metrics & Targets phase in progress for 2026 sustainability report",
        "Water abstraction from shared catchments requires multi-stakeholder basin management approach",
      ],
    },
    climateRisk: {
      transitionDetails: [
        "EU Deforestation Regulation (EUDR) enforcement deadline 30 December 2026 requires supply chain geolocation data for EU export",
        "Carbon pricing under Malaysia's voluntary carbon market will affect peatland management costs",
        "Consumer boycott risk from palm oil controversies in European retail channels",
      ],
      physicalDetails: [
        "El Niño-driven drought events reducing crop yields by 15-30% in affected years",
        "Increased rainfall variability in Sabah affecting harvest scheduling and logistics",
        "Peat soil subsidence risk in drainage areas following peat conservation commitments",
      ],
    },
    boardComposition: { boardSize: 8, independentPct: 38, womenPct: 25, ceoChairSplit: false, auditCommittee: true, esgCommittee: false },
    historicalScores: [
      { period: "Q1 2024", e: 38, s: 55, g: 55 },
      { period: "Q2 2024", e: 40, s: 57, g: 58 },
      { period: "Q3 2024", e: 42, s: 58, g: 59 },
      { period: "Q4 2024", e: 43, s: 59, g: 60 },
      { period: "Q1 2025", e: 44, s: 61, g: 62 },
      { period: "Q2 2025", e: 46, s: 62, g: 63 },
      { period: "Q3 2025", e: 47, s: 63, g: 64 },
      { period: "Q4 2025", e: 47, s: 62, g: 64 },
      { period: "Q1 2026", e: 48, s: 62, g: 64 },
      { period: "Q2 2026", e: 49, s: 63, g: 65 },
    ],
    sdgAlignment: [
      { sdg: 2, label: "Zero Hunger" },
      { sdg: 13, label: "Climate Action" },
      { sdg: 15, label: "Life on Land" },
    ],
    valueUplift: [
      { area: "EUDR Traceability System", potential: "High", description: "Invest in satellite-linked supply chain traceability platform to achieve full EUDR compliance and protect EU revenue stream. Also unlocks Japan/Korea sustainability premiums." },
      { area: "Biodiversity Credits", potential: "Medium", description: "HCV areas and conservation corridors adjacent to Maliau Basin could generate SBTN-aligned biodiversity credits. Nascent market but growing institutional buyer base." },
      { area: "Sustainable Commodity Premium", potential: "High", description: "RSPO P&C 2018 + EUDR compliance enables US$50-80/MT premium over conventional palm oil in European and Japanese markets." },
    ],
    tnfdPillars: [
      { pillar: "Governance", status: "Partial" },
      { pillar: "Strategy", status: "Partial" },
      { pillar: "Risk & Impact Mgmt", status: "Partial" },
      { pillar: "Metrics & Targets", status: "Gap" },
    ],
  },

  "asiapower-energy": {
    natureRisk: {
      biodiversityExposure: true, waterStress: true, deforestationRisk: false, tnfdAligned: false,      details: [
        "Geothermal development in forested areas in Sumatra requires biodiversity offset planning",
        "Coal ash disposal at three legacy sites requires TNFD-aligned habitat restoration assessment",
      ],
    },
    climateRisk: {
      transitionDetails: [
        "4.2GW coal fleet faces stranded asset risk under Indonesia's JETP 2050 net zero pathway and accelerated coal phase-out (2040 target)",
        "Carbon pricing under Indonesia's cap-and-trade system (IDL/ETS) effective 2025 adds S$8-15/tonne cost to coal operations",
        "PLN offtake agreements for coal plants subject to renegotiation as government shifts procurement to renewables",
        "Transition risk to debt investors: S$3.2B in USD bonds with green covenants coming due 2027-2029",
      ],
      physicalDetails: [
        "Geothermal assets in Sumatra exposed to seismic risk (high geological activity)",
        "Hydro-dependent cooling systems at thermal plants face water availability risk under drought scenarios",
      ],
    },
    boardComposition: { boardSize: 10, independentPct: 40, womenPct: 20, ceoChairSplit: true, auditCommittee: true, esgCommittee: false },
    historicalScores: [
      { period: "Q1 2024", e: 25, s: 48, g: 44 },
      { period: "Q2 2024", e: 27, s: 50, g: 47 },
      { period: "Q3 2024", e: 29, s: 52, g: 47 },
      { period: "Q4 2024", e: 31, s: 53, g: 49 },
      { period: "Q1 2025", e: 32, s: 55, g: 52 },
      { period: "Q2 2025", e: 34, s: 56, g: 53 },
      { period: "Q3 2025", e: 36, s: 57, g: 54 },
      { period: "Q4 2025", e: 35, s: 55, g: 52 },
      { period: "Q1 2026", e: 36, s: 56, g: 53 },
      { period: "Q2 2026", e: 37, s: 55, g: 52 },
    ],
    sdgAlignment: [
      { sdg: 7, label: "Clean Energy" },
      { sdg: 8, label: "Decent Work" },
      { sdg: 13, label: "Climate Action" },
    ],
    valueUplift: [
      { area: "JETP ETM Coal Retirement", potential: "High", description: "Early coal plant retirement under JETP Energy Transition Mechanism unlocks blended finance (ADB, AIIB, climate funds). Accelerates stranded asset write-down while accessing concessional capital." },
      { area: "Geothermal Scale-Up", potential: "High", description: "800MW Sumatra geothermal pipeline + new Sulawesi prospects. Green bonds and multilateral financing available. Positions AsiaPower as ASEAN's leading geothermal developer." },
      { area: "Just Transition Plan", potential: "Medium", description: "ILO-aligned Just Transition plan for coal workforce unlocks access to IFC and European DFI co-investment. Reduces regulatory and social licence risk in coal phase-out." },
    ],
    tnfdPillars: [
      { pillar: "Governance", status: "Gap" },
      { pillar: "Strategy", status: "Gap" },
      { pillar: "Risk & Impact Mgmt", status: "Gap" },
      { pillar: "Metrics & Targets", status: "Gap" },
    ],
  },

  "medilink-health": {
    natureRisk: {
      biodiversityExposure: false, waterStress: false, deforestationRisk: false, tnfdAligned: false,      details: [
        "Digital-only business model with no physical resource extraction dependencies",
      ],
    },
    climateRisk: {
      transitionDetails: [
        "Cloud infrastructure emissions (Scope 2) immaterial relative to healthcare impact value",
        "No significant regulatory climate risk for digital health sector",
      ],
      physicalDetails: [
        "Data centres exposed to Singapore temperature increase — cooling cost uplift est. 5% by 2035",
      ],
    },
    boardComposition: { boardSize: 5, independentPct: 40, womenPct: 20, ceoChairSplit: false, auditCommittee: false, esgCommittee: false },
    historicalScores: [
      { period: "Q1 2024", e: 30, s: 62, g: 42 },
      { period: "Q2 2024", e: 31, s: 64, g: 44 },
      { period: "Q3 2024", e: 33, s: 65, g: 46 },
      { period: "Q4 2024", e: 34, s: 67, g: 48 },
      { period: "Q1 2025", e: 35, s: 68, g: 50 },
      { period: "Q2 2025", e: 37, s: 70, g: 52 },
      { period: "Q3 2025", e: 38, s: 71, g: 53 },
      { period: "Q4 2025", e: 38, s: 71, g: 55 },
      { period: "Q1 2026", e: 39, s: 72, g: 55 },
      { period: "Q2 2026", e: 40, s: 72, g: 56 },
    ],
    sdgAlignment: [
      { sdg: 3, label: "Good Health" },
      { sdg: 10, label: "Reduced Inequalities" },
    ],
    valueUplift: [
      { area: "Inclusive Finance Integration", potential: "High", description: "Partner with Nusantara Bank (portfolio company) to offer embedded microinsurance and health savings products to MediLink's 40M+ patient base. Creates synergistic value across Temasek's portfolio aligned with inclusive growth mandate." },
      { area: "Responsible AI Certification", potential: "High", description: "Achieve MOH AI in Healthcare accreditation and MAS FEAT compliance across financial health products. Positions MediLink as the only certified AI health platform in ASEAN — critical differentiator for government and insurer contracts." },
      { area: "Carbon-Neutral Telehealth", potential: "Medium", description: "Achieve net zero Scope 1+2 by 2026 via I-REC + energy efficiency. Enables access to European development finance and WHO digital health partnership programmes that require ESG baseline standards." },
    ],
    tnfdPillars: [
      { pillar: "Governance", status: "Gap" },
      { pillar: "Strategy", status: "Gap" },
      { pillar: "Risk & Impact Mgmt", status: "Gap" },
      { pillar: "Metrics & Targets", status: "Gap" },
    ],
    icRecommendation: {
      verdict: "Invest Conditional",
      conditions: [
        "Independent audit committee chair appointed (pre-close condition)",
        "AI bias testing expanded to Indonesia and Vietnam patient cohorts",
        "PDPA cross-border data transfer policy updated and externally audited",
      ],
      esgGating: "No investment to close without independent confirmation of all three ESG conditions precedent. Re-evaluate in Q4 2026.",
    },
  },
};

// ---------------------------------------------------------------------------

function dbToCompany(
  co: DbCompany,
  engagements: DbEngagement[],
  issues: DbMaterialIssue[]
): Company {
  const enrichment = ENRICHMENT[co.slug];

  // Derive nature risk flags from sector and nature_risk level (fallback for admin-added companies)
  const sector = co.sector.toLowerCase();
  const isAgri = sector.includes("agri") || sector.includes("palm") || sector.includes("agriculture");
  const isMarine = sector.includes("marine") || sector.includes("shipping");
  const natureLevel = co.nature_risk as string;
  const isHighNature = natureLevel === "Critical" || natureLevel === "High";

  // Derive transition context from transition_risk level (fallback for admin-added companies)
  const transitionLevel = co.transition_risk as string;
  const derivedTransitionDetails = transitionLevel === "Critical" ? [
    "Significant carbon pricing exposure as regulations tighten",
    "Stranded asset risk from fossil fuel dependency",
    "Paris-misaligned pathway requires urgent strategy revision",
  ] : transitionLevel === "High" ? [
    "Moderate carbon pricing exposure in operating markets",
    "Technology transition investment required for decarbonisation",
  ] : transitionLevel === "Medium" ? [
    "Some exposure to transition policies; monitoring required",
  ] : [];

  const derivedPhysicalDetails = (isHighNature || transitionLevel === "High" || transitionLevel === "Critical") ? [
    "Operational exposure to climate-related physical risks in operating region",
  ] : [];

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
      transitionDetails: enrichment?.climateRisk.transitionDetails ?? derivedTransitionDetails,
      physicalDetails: enrichment?.climateRisk.physicalDetails ?? derivedPhysicalDetails,
    },
    natureRisk: {
      overall: co.nature_risk as Company["natureRisk"]["overall"],
      biodiversityExposure: enrichment?.natureRisk.biodiversityExposure ?? (isHighNature && (isAgri || isMarine)),
      waterStress: enrichment?.natureRisk.waterStress ?? (isHighNature && isAgri),
      deforestationRisk: enrichment?.natureRisk.deforestationRisk ?? (isAgri && isHighNature),
      tnfdAligned: enrichment?.natureRisk.tnfdAligned ?? false,
      details: enrichment?.natureRisk.details ?? (isHighNature ? [
        `Nature risk level: ${co.nature_risk}. TNFD assessment recommended.`,
      ] : []),
      tnfdPillars: enrichment?.tnfdPillars ?? [
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
    // historicalScores: use enrichment (10 periods) or derive 2-period from current scores
    historicalScores: enrichment?.historicalScores ?? [
      { period: "Q1 2026", e: Math.max(0, co.esg_environmental - 2), s: Math.max(0, co.esg_social - 1), g: Math.max(0, co.esg_governance - 2) },
      { period: "Q2 2026", e: co.esg_environmental, s: co.esg_social, g: co.esg_governance },
    ],
    boardComposition: enrichment?.boardComposition ?? {
      boardSize: 8,
      independentPct: co.esg_governance >= 65 ? 56 : co.esg_governance >= 50 ? 44 : 38,
      womenPct: co.esg_governance >= 70 ? 33 : 25,
      ceoChairSplit: co.esg_governance >= 60,
      auditCommittee: co.esg_governance >= 50,
      esgCommittee: co.esg_governance >= 70,
    },
    valueUplift: enrichment?.valueUplift ?? [],
    sdgAlignment: enrichment?.sdgAlignment ?? [],
    icRecommendation: enrichment?.icRecommendation,
  };
}

let cachedCompanies: Company[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5_000; // 5 second cache (short to ensure mutations from admin propagate quickly)

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

