export type ESGRating = "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type MaturityLevel = "Leading" | "Advanced" | "Developing" | "Lagging";

export interface ESGScore {
  overall: number; // 0-100
  environmental: number;
  social: number;
  governance: number;
  rating: ESGRating;
}

export interface ClimateRisk {
  physical: RiskLevel;
  transition: RiskLevel;
  physicalDetails: string[];
  transitionDetails: string[];
  pathwayAlignment: "1.5°C" | "2°C" | "3°C+" | "Not assessed";
}

export interface NatureRisk {
  overall: RiskLevel;
  biodiversityExposure: boolean;
  waterStress: boolean;
  deforestationRisk: boolean;
  tnfdAligned: boolean;
  details: string[];
  tnfdPillars?: { pillar: string; status: "Adopted" | "Partial" | "Gap" }[];
}

export interface MaterialIssue {
  category: "Environmental" | "Social" | "Governance";
  issue: string;
  severity: RiskLevel;
  opportunity: boolean;
  detail: string;
}

export interface ValueUplift {
  area: string;
  potential: "High" | "Medium" | "Low";
  description: string;
}

export interface EngagementRecord {
  date: string;
  type: "Meeting" | "Report Review" | "Site Visit" | "Call";
  topic: string;
  status: "Completed" | "Planned" | "Overdue";
  notes: string;
}

export interface SDGTag {
  sdg: number;
  label: string;
}

export interface BoardComposition {
  boardSize: number;
  independentPct: number;
  womenPct: number;
  ceoChairSplit: boolean;
  auditCommittee: boolean;
  esgCommittee: boolean;
}

export interface Company {
  slug: string;
  name: string;
  sector: string;
  sasbCategory: string;
  country: string;
  region: string;
  description: string;
  portfolioStatus: "Active" | "Pipeline";
  temasekMegatrend: "Climate Transition" | "Nature & Biodiversity" | "Just Transition & Inclusive Growth" | "AI & Digital Ethics" | "Longer Lifespans";
  esgScore: ESGScore;
  maturity: MaturityLevel;
  climateRisk: ClimateRisk;
  natureRisk: NatureRisk;
  materialIssues: MaterialIssue[];
  valueUplift: ValueUplift[];
  engagement: EngagementRecord[];
  investmentValue: number; // SGD millions
  carbonIntensity: number; // tCO2e / $M revenue
  greenRevenuePct: number; // % of revenue from green activities
  lastUpdated: string;
  historicalScores: { period: string; e: number; s: number; g: number }[];
  icRecommendation?: {
    verdict: "Invest" | "Invest Conditional" | "Pass";
    conditions: string[];
    esgGating: string;
  };
  sdgAlignment: SDGTag[];
  netZeroCommitment: "SBTi Committed" | "SBTi Targets Set" | "Net Zero Pledged" | "None";
  boardComposition: BoardComposition;
}

export const companies: Company[] = [
  {
    slug: "seaport-logistics",
    name: "SeaPort Logistics",
    sector: "Marine Transport & Logistics",
    sasbCategory: "Marine Transportation",
    country: "Singapore",
    region: "Southeast Asia",
    description:
      "A leading regional port and logistics operator headquartered in Singapore, operating across six ASEAN countries with deep-sea terminal concessions and inland freight networks.",
    portfolioStatus: "Active",
    temasekMegatrend: "Climate Transition",
    esgScore: {
      overall: 53,
      environmental: 41,
      social: 61,
      governance: 58,
      rating: "BB",
    },
    maturity: "Developing",
    climateRisk: {
      physical: "High",
      transition: "High",
      physicalDetails: [
        "Port infrastructure exposed to rising sea levels across Singapore, Vietnam, and Indonesia terminals",
        "Increased storm surge frequency threatens terminal operations in Gulf of Thailand",
        "Heat stress impacts on dock worker productivity and equipment performance",
      ],
      transitionDetails: [
        "Fleet of 120+ vessels predominantly HFO-powered, facing IMO 2030 carbon intensity regulations",
        "EU ETS expansion to shipping from 2024 increases operating costs by est. 8-12%",
        "Customer Scope 3 reduction targets creating pressure to offer low-emission freight options",
      ],
      pathwayAlignment: "1.5°C",
    },
    natureRisk: {
      overall: "Medium",
      biodiversityExposure: true,
      waterStress: false,
      deforestationRisk: false,
      tnfdAligned: false,
      details: [
        "Dredging operations at two port expansion sites may impact marine biodiversity",
        "Ballast water management compliance with IMO BWM Convention required across aging fleet",
      ],
      tnfdPillars: [
        { pillar: "Governance", status: "Partial" },
        { pillar: "Strategy", status: "Gap" },
        { pillar: "Risk & Impact Mgmt", status: "Gap" },
        { pillar: "Metrics & Targets", status: "Gap" },
      ],
    },
    materialIssues: [
      {
        category: "Environmental",
        issue: "GHG Emissions (Scope 1 & 3)",
        severity: "Critical",
        opportunity: false,
        detail:
          "Fleet decarbonisation is the single largest financial risk. IMO CII ratings deteriorating across 40% of owned vessels.",
      },
      {
        category: "Environmental",
        issue: "Physical Climate Risk",
        severity: "High",
        opportunity: false,
        detail:
          "S$340M of fixed port infrastructure in high sea-level-rise risk zones by 2050.",
      },
      {
        category: "Social",
        issue: "Labour Practices & Seafarer Welfare",
        severity: "Medium",
        opportunity: false,
        detail:
          "MLC 2006 compliance strong, but migrant worker welfare in onshore operations flagged in 2023 audit.",
      },
      {
        category: "Governance",
        issue: "Board Independence",
        severity: "Medium",
        opportunity: false,
        detail:
          "5 of 9 board members classified as non-independent under SGX rules, below best practice.",
      },
      {
        category: "Environmental",
        issue: "Green Freight Services",
        severity: "Low",
        opportunity: true,
        detail:
          "First-mover opportunity to offer verified low-carbon shipping lanes. ESG-linked freight contracts growing at 23% p.a. in ASEAN.",
      },
    ],
    valueUplift: [
      {
        area: "Green Fleet Transition",
        potential: "High",
        description:
          "Methanol-ready vessel retrofits unlock ESG-linked financing at 40-80bps lower cost. IFC and ADB green shipping facilities available.",
      },
      {
        area: "Carbon-Labelled Freight",
        potential: "Medium",
        description:
          "Launch verified low-emission freight tier (LNG/methanol). Customer willingness-to-pay premium est. 5-8% among MNC shippers with Scope 3 targets.",
      },
      {
        area: "Port Electrification",
        potential: "Medium",
        description:
          "Solar + shore power at Singapore terminal reduces grid electricity costs by 30% and unlocks BCA Green Mark certification.",
      },
    ],
    engagement: [
      {
        date: "2025-03-12",
        type: "Meeting",
        topic: "Fleet Decarbonisation Roadmap",
        status: "Completed",
        notes:
          "CEO and CFO committed to publishing Net Zero pathway by Q3 2025. IMO CII targets to be embedded in capex planning.",
      },
      {
        date: "2025-06-20",
        type: "Report Review",
        topic: "2024 Sustainability Report Review",
        status: "Completed",
        notes:
          "Scope 1 emissions up 4% YoY due to fleet expansion. Baseline year reset to 2023 agreed. TCFD disclosure partially compliant.",
      },
      {
        date: "2025-11-05",
        type: "Meeting",
        topic: "ESG Action Plan Progress Review",
        status: "Overdue",
        notes: "Q3 CII ratings review and methanol pilot update. Note: CEO commitment from March 2025 to publish Net Zero pathway by Q3 2025 was not met — pathway publication now deferred to 2026 alongside SBTi near-term target submission.",
      },
      {
        date: "2026-09-10",
        type: "Meeting",
        topic: "Net Zero Pathway & CII Fleet Compliance Review",
        status: "Planned",
        notes: "Annual ESG review: IMO CII ratings for full fleet, methanol dual-fuel pilot vessel progress update, and Net Zero 2050 pathway publication review. Target: SBTi-aligned near-term target submission by year-end.",
      },
    ],
    investmentValue: 450,
    carbonIntensity: 312,
    greenRevenuePct: 3,
    lastUpdated: "2026-05-14",
    sdgAlignment: [
      { sdg: 13, label: "Climate Action" },
      { sdg: 14, label: "Life Below Water" },
    ],
    netZeroCommitment: "SBTi Committed",
    boardComposition: {
      boardSize: 9,
      independentPct: 44,
      womenPct: 22,
      ceoChairSplit: true,
      auditCommittee: true,
      esgCommittee: false,
    },
    historicalScores: [
      { period: "Q1 2024", e: 35, s: 55, g: 50 },
      { period: "Q2 2024", e: 33, s: 57, g: 52 },
      { period: "Q3 2024", e: 36, s: 59, g: 53 },
      { period: "Q4 2024", e: 39, s: 60, g: 55 },
      { period: "Q1 2025", e: 41, s: 61, g: 58 },
      { period: "Q2 2025", e: 40, s: 62, g: 60 },
      { period: "Q3 2025", e: 42, s: 63, g: 61 },
      { period: "Q4 2025", e: 40, s: 60, g: 57 },
      { period: "Q1 2026", e: 40, s: 60, g: 57 },
      { period: "Q2 2026", e: 41, s: 61, g: 58 },
    ],
  },
  {
    slug: "nusantara-bank",
    name: "Nusantara Bank",
    sector: "Commercial Banking",
    sasbCategory: "Commercial Banks",
    country: "Indonesia",
    region: "Southeast Asia",
    description:
      "Indonesia's fourth-largest commercial bank by assets, with a growing retail and SME franchise across Java, Sumatra, and Kalimantan, and a rising sustainable finance portfolio.",
    portfolioStatus: "Active",
    temasekMegatrend: "Climate Transition",
    esgScore: {
      overall: 65,
      environmental: 55,
      social: 68,
      governance: 72,
      rating: "A",
    },
    maturity: "Advanced",
    climateRisk: {
      physical: "Medium",
      transition: "High",
      physicalDetails: [
        "Loan book exposure to agriculture and real estate in flood-prone Kalimantan and coastal Java",
        "Physical damage risk to collateral assets estimated at 6-9% of secured loan book by 2040",
      ],
      transitionDetails: [
        "22% of corporate loan book in carbon-intensive sectors (coal, palm oil, cement)",
        "Indonesia coal phase-out under JETP creates credit risk for mining and power sector clients",
        "OJK (Indonesia FSA) mandatory climate risk disclosure requirements effective 2025",
      ],
      pathwayAlignment: "2°C",
    },
    natureRisk: {
      overall: "High",
      biodiversityExposure: true,
      waterStress: false,
      deforestationRisk: true,
      tnfdAligned: false,
      details: [
        "Palm oil and timber sector lending (~8% of book) exposed to EUDR deforestation regulation compliance risk",
        "No TNFD assessment conducted; forest-risk commodity exposure unquantified",
        "ESG screening for new agriculture lending introduced in 2024 but lacks deforestation-free verification",
      ],
      tnfdPillars: [
        { pillar: "Governance", status: "Partial" },
        { pillar: "Strategy", status: "Partial" },
        { pillar: "Risk & Impact Mgmt", status: "Gap" },
        { pillar: "Metrics & Targets", status: "Gap" },
      ],
    },
    materialIssues: [
      {
        category: "Environmental",
        issue: "Financed Emissions",
        severity: "High",
        opportunity: false,
        detail:
          "Scope 3 Category 15 (financed emissions) not yet disclosed. Coal sector loans represent ~S$2.1B exposure facing stranded asset risk.",
      },
      {
        category: "Environmental",
        issue: "Nature & Deforestation Risk",
        severity: "High",
        opportunity: false,
        detail:
          "EUDR enforcement creates immediate compliance risk for palm oil clients and by extension credit quality of ~S$1.4B in loans.",
      },
      {
        category: "Governance",
        issue: "Anti-Corruption Controls",
        severity: "Medium",
        opportunity: false,
        detail:
          "Two regulatory notices from OJK on KYC compliance in 2022-2023. Remediation plan in progress.",
      },
      {
        category: "Social",
        issue: "Financial Inclusion",
        severity: "Low",
        opportunity: true,
        detail:
          "40% of Indonesia remains unbanked. Digital banking expansion aligns with OJK inclusion mandate and Temasek's inclusive growth thesis.",
      },
      {
        category: "Environmental",
        issue: "Sustainable Finance Growth",
        severity: "Low",
        opportunity: true,
        detail:
          "Green and sustainability-linked loan issuance grew 67% in 2024. MAS-OJK bilateral green finance facility provides subsidised liquidity.",
      },
    ],
    valueUplift: [
      {
        area: "JETP Transition Finance",
        potential: "High",
        description:
          "Indonesia's $20B JETP creates demand for transition finance products. Position bank as preferred arranger for coal-to-renewables refinancing.",
      },
      {
        area: "Nature-Positive Lending Policy",
        potential: "High",
        description:
          "Adopt TNFD-aligned forest-risk commodity policy to de-risk EUDR exposure and unlock HSBC/IFC co-lending partnerships.",
      },
      {
        area: "Digital Inclusive Finance",
        potential: "Medium",
        description:
          "ESG-linked digital credit products for unbanked SMEs. Blended finance available via ADB Digital Finance Facility.",
      },
      {
        area: "Digital Health Embedded Finance",
        potential: "High",
        description:
          "Cross-portfolio opportunity with MediLink Health (Pipeline): offer embedded microinsurance and health savings products to MediLink's 40M+ ASEAN patient base. Aligns with OJK financial inclusion mandate and Temasek's Longer Lifespans and AI & Digital Ethics megatrend thesis.",
      },
    ],
    engagement: [
      {
        date: "2025-02-18",
        type: "Meeting",
        topic: "Financed Emissions Disclosure Roadmap",
        status: "Completed",
        notes:
          "Chief Risk Officer agreed to PCAF methodology adoption for Scope 3 Cat 15 by end-2025. Pilot with top 50 corporate clients underway.",
      },
      {
        date: "2025-05-30",
        type: "Call",
        topic: "EUDR Client Readiness Assessment",
        status: "Completed",
        notes:
          "Palm oil portfolio review: 14 clients lack EUDR-compliant supply chain traceability. Remediation timeline 18 months.",
      },
      {
        date: "2025-09-10",
        type: "Meeting",
        topic: "TNFD Assessment Scoping",
        status: "Overdue",
        notes: "Meeting not completed — agenda was to scope TNFD LEAP pilot for forest-risk commodity lending. Follow-up required to establish timeline and assign ESG team lead before Q4 2025 reporting cycle.",
      },
      {
        date: "2026-03-15",
        type: "Call",
        topic: "Financed Emissions Disclosure Progress Check",
        status: "Overdue",
        notes: "Q1 2026 PCAF methodology adoption review overdue. PCAF pilot with top 50 corporate clients was targeted for Q4 2025 — completion status unconfirmed.",
      },
      {
        date: "2026-09-22",
        type: "Meeting",
        topic: "PCAF Pilot Completion Review & TNFD Assessment Update",
        status: "Planned",
        notes: "Review PCAF financed emissions pilot completion across top 50 corporate clients. Assess TNFD assessment scoping progress and set Q4 2026 timeline for full LEAP methodology adoption. Discuss green bond framework for sustainable lending portfolio.",
      },
    ],
    investmentValue: 620,
    carbonIntensity: 18,
    greenRevenuePct: 12,
    lastUpdated: "2026-04-28",
    sdgAlignment: [
      { sdg: 8, label: "Decent Work" },
      { sdg: 10, label: "Reduced Inequalities" },
      { sdg: 13, label: "Climate Action" },
    ],
    netZeroCommitment: "Net Zero Pledged",
    boardComposition: {
      boardSize: 8,
      independentPct: 50,
      womenPct: 25,
      ceoChairSplit: true,
      auditCommittee: true,
      esgCommittee: true,
    },
    historicalScores: [
      { period: "Q1 2024", e: 48, s: 62, g: 65 },
      { period: "Q2 2024", e: 50, s: 63, g: 62 },
      { period: "Q3 2024", e: 52, s: 65, g: 67 },
      { period: "Q4 2024", e: 53, s: 67, g: 70 },
      { period: "Q1 2025", e: 55, s: 68, g: 72 },
      { period: "Q2 2025", e: 57, s: 69, g: 73 },
      { period: "Q3 2025", e: 56, s: 70, g: 74 },
      { period: "Q4 2025", e: 54, s: 67, g: 71 },
      { period: "Q1 2026", e: 54, s: 67, g: 71 },
      { period: "Q2 2026", e: 55, s: 68, g: 72 },
    ],
  },
  {
    slug: "cloudmesh-technologies",
    name: "CloudMesh Technologies",
    sector: "Cloud Infrastructure & SaaS",
    sasbCategory: "Software & IT Services",
    country: "Singapore",
    region: "Asia Pacific",
    description:
      "A Singapore-headquartered B2B cloud infrastructure and SaaS provider serving financial services, healthcare, and government clients across APAC, with data centres in Singapore, Australia, and Japan.",
    portfolioStatus: "Active",
    temasekMegatrend: "AI & Digital Ethics",
    esgScore: {
      overall: 72,
      environmental: 63,
      social: 74,
      governance: 78,
      rating: "A",
    },
    maturity: "Advanced",
    climateRisk: {
      physical: "Low",
      transition: "Medium",
      physicalDetails: [
        "Singapore data centre cooling demand increases with rising ambient temperatures (est. +8% energy per 1°C ambient increase)",
        "Limited physical risk given hardened data centre infrastructure",
      ],
      transitionDetails: [
        "Singapore grid still ~95% natural gas; Scope 2 emissions material until regional grid decarbonises",
        "Customers increasingly requiring sustainability reporting on cloud workloads under ISSB S2",
        "EU AI Act and MAS Model AI Governance Framework adding compliance costs for AI product lines",
      ],
      pathwayAlignment: "1.5°C",
    },
    natureRisk: {
      overall: "Low",
      biodiversityExposure: false,
      waterStress: true,
      deforestationRisk: false,
      tnfdAligned: false,
      details: [
        "Data centre water consumption for cooling is material; Singapore faces long-term freshwater constraints",
        "Water Usage Effectiveness (WUE) metric not publicly disclosed",
      ],
      tnfdPillars: [
        { pillar: "Governance", status: "Partial" },
        { pillar: "Strategy", status: "Partial" },
        { pillar: "Risk & Impact Mgmt", status: "Gap" },
        { pillar: "Metrics & Targets", status: "Gap" },
      ],
    },
    materialIssues: [
      {
        category: "Environmental",
        issue: "Data Centre Energy & Emissions",
        severity: "High",
        opportunity: false,
        detail:
          "PUE average of 1.6 across fleet, above best-in-class 1.2. Singapore's moratorium on new data centres (lifted 2022) requires GreenMark Platinum for new builds.",
      },
      {
        category: "Social",
        issue: "Data Privacy & Cybersecurity",
        severity: "High",
        opportunity: false,
        detail:
          "Handling data for MAS-regulated financial institutions; one security incident in 2023. ISO 27001 certified but SOC 2 Type II pending.",
      },
      {
        category: "Governance",
        issue: "AI Ethics & Responsible AI",
        severity: "Medium",
        opportunity: false,
        detail:
          "AI product lines lack published responsible AI policy. MAS FEAT Principles apply to financial sector clients using AI tools.",
      },
      {
        category: "Social",
        issue: "Digital Skills & Workforce",
        severity: "Low",
        opportunity: true,
        detail:
          "SkillsFuture alignment and tech talent pipeline are value-creation levers for Singapore-based operations.",
      },
      {
        category: "Environmental",
        issue: "Renewable Energy Procurement",
        severity: "Low",
        opportunity: true,
        detail:
          "Singapore's Energy Market Authority I-REC scheme and regional renewable PPAs from Malaysia/Vietnam are available pathways to 100% RE.",
      },
    ],
    valueUplift: [
      {
        area: "Green Cloud Certification",
        potential: "High",
        description:
          "BCA Green Mark Platinum for Singapore DC + 100% renewable energy claim via I-REC unlocks premium pricing with ESG-conscious enterprise clients (10-15% willingness-to-pay premium).",
      },
      {
        area: "Responsible AI Framework",
        potential: "Medium",
        description:
          "Publish MAS FEAT-aligned AI governance framework. Differentiator for financial services clients facing AI regulatory scrutiny.",
      },
      {
        area: "Sustainability Analytics Product",
        potential: "High",
        description:
          "Embed carbon accounting into cloud billing dashboard. ISSB S2 reporting requirement creates $2B+ APAC market for enterprise carbon management SaaS.",
      },
    ],
    engagement: [
      {
        date: "2025-01-25",
        type: "Meeting",
        topic: "Data Centre Decarbonisation Plan",
        status: "Completed",
        notes:
          "CTO committed to PUE target of 1.35 by 2027. I-REC procurement for 60% of Singapore DC energy by end-2025.",
      },
      {
        date: "2025-04-15",
        type: "Report Review",
        topic: "AI Governance Policy Draft Review",
        status: "Completed",
        notes:
          "First draft AI ethics policy reviewed. Recommend aligning with MAS FEAT Principles and publishing externally by Q2 2026.",
      },
      {
        date: "2025-10-20",
        type: "Meeting",
        topic: "Sustainability Analytics Product Roadmap",
        status: "Overdue",
        notes: "Meeting missed — product team scheduling conflict. Agenda was to review carbon management SaaS roadmap for APAC enterprise, including competitive positioning vs Watershed and Persefoni. Rescheduled to Q1 2026 but not completed.",
      },
      {
        date: "2026-08-20",
        type: "Meeting",
        topic: "Responsible AI Policy Launch & Carbon Analytics Product Review",
        status: "Planned",
        notes: "Review published MAS FEAT-aligned AI Governance Policy (target Q2 2026). Assess Carbon Management SaaS product traction and pipeline against APAC ISSB S2 disclosure demand. Discuss I-REC procurement progress toward 100% RE target.",
      },
    ],
    investmentValue: 285,
    carbonIntensity: 45,
    greenRevenuePct: 8,
    lastUpdated: "2026-06-20",
    sdgAlignment: [
      { sdg: 9, label: "Industry & Innovation" },
      { sdg: 13, label: "Climate Action" },
    ],
    netZeroCommitment: "SBTi Targets Set",
    boardComposition: {
      boardSize: 7,
      independentPct: 57,
      womenPct: 29,
      ceoChairSplit: true,
      auditCommittee: true,
      esgCommittee: true,
    },
    historicalScores: [
      { period: "Q1 2024", e: 55, s: 68, g: 72 },
      { period: "Q2 2024", e: 57, s: 70, g: 74 },
      { period: "Q3 2024", e: 60, s: 70, g: 75 },
      { period: "Q4 2024", e: 62, s: 72, g: 77 },
      { period: "Q1 2025", e: 63, s: 74, g: 78 },
      { period: "Q2 2025", e: 65, s: 75, g: 79 },
      { period: "Q3 2025", e: 67, s: 76, g: 80 },
      { period: "Q4 2025", e: 62, s: 73, g: 77 },
      { period: "Q1 2026", e: 62, s: 73, g: 77 },
      { period: "Q2 2026", e: 63, s: 74, g: 78 },
    ],
  },
  {
    slug: "greenharvest-agri",
    name: "GreenHarvest Agri",
    sector: "Agriculture & Agribusiness",
    sasbCategory: "Agricultural Products",
    country: "Malaysia",
    region: "Southeast Asia",
    description:
      "A Malaysian agribusiness producing sustainable palm oil, rubber, and tropical fruits across Sabah and Sarawak, with RSPO certification and growing export markets in Europe and China.",
    portfolioStatus: "Active",
    temasekMegatrend: "Nature & Biodiversity",
    esgScore: {
      overall: 59,
      environmental: 49,
      social: 63,
      governance: 65,
      rating: "BBB",
    },
    maturity: "Developing",
    climateRisk: {
      physical: "High",
      transition: "High",
      physicalDetails: [
        "El Niño-driven drought events reducing crop yields by 15-30% in affected years",
        "Increased rainfall variability in Sabah affecting harvest scheduling and logistics",
        "Peat soil subsidence risk in drainage areas following peat conservation commitments",
      ],
      transitionDetails: [
        "EU Deforestation Regulation (EUDR) enforcement deadline 30 December 2026 requires supply chain geolocation data for EU export",
        "Carbon pricing under Malaysia's voluntary carbon market will affect peatland management costs",
        "Consumer boycott risk from palm oil controversies in European retail channels",
      ],
      pathwayAlignment: "1.5°C",
    },
    natureRisk: {
      overall: "Critical",
      biodiversityExposure: true,
      waterStress: true,
      deforestationRisk: true,
      tnfdAligned: false,
      details: [
        "Operations adjacent to Maliau Basin Conservation Area (Sabah's 'Lost World'); buffer zone management is critical",
        "High Conservation Value (HCV) assessments completed for 80% of landbank, 20% pending",
        "TNFD LEAP assessment (phases L-A) completed Q3 2025 — one of first agribusiness companies in ASEAN to complete TNFD LEAP Risk Assessment phase. Metrics & Targets phase in progress for 2026 sustainability report",
        "Water abstraction from shared catchments requires multi-stakeholder basin management approach",
      ],
      tnfdPillars: [
        { pillar: "Governance", status: "Partial" },
        { pillar: "Strategy", status: "Partial" },
        { pillar: "Risk & Impact Mgmt", status: "Partial" },
        { pillar: "Metrics & Targets", status: "Gap" },
      ],
    },
    materialIssues: [
      {
        category: "Environmental",
        issue: "Deforestation & Land Use Change",
        severity: "Critical",
        opportunity: false,
        detail:
          "No-deforestation, No-peat, No-exploitation (NDPE) policy adopted 2021 but verification gaps remain in third-party supplier sourcing.",
      },
      {
        category: "Environmental",
        issue: "EUDR Compliance",
        severity: "Critical",
        opportunity: false,
        detail:
          "EU accounts for 22% of revenue. EUDR enforcement deadline is 30 December 2026 (delayed twice from December 2024). Bureau Veritas appointed May 2026 as compliance verifier; audit scope agreed. Unilever (key EU buyer) has granted a 90-day grace period. Full verification targeted Q3 2026. EU export revenues remain at risk until audit certificate issued.",
      },
      {
        category: "Social",
        issue: "Smallholder & Labour Rights",
        severity: "High",
        opportunity: false,
        detail:
          "Migrant worker housing standards flagged in 2023 RSPO audit. Remediation in progress. Smallholder inclusion programme covers only 30% of supply base.",
      },
      {
        category: "Governance",
        issue: "NDPE Policy Independent Oversight",
        severity: "Medium",
        opportunity: false,
        detail:
          "No-deforestation, No-peat, No-exploitation (NDPE) policy compliance relies on internal monitoring with no external independent audit. RSPO P&C 2018 requires third-party verification; absence creates credibility risk with European buyers and DFI co-investors. Gap also affects eligibility for sustainability-linked financing structures.",
      },
      {
        category: "Governance",
        issue: "Board Independence & Leadership Structure",
        severity: "Medium",
        opportunity: false,
        detail:
          "Board independence at 38% (3 of 8 directors) is the lowest across the active portfolio and below the 50% best-practice threshold. Combined CEO-Chair role adds concentration risk. Given two Critical ESG issues involving European buyer compliance, strong board oversight is essential. Pre-condition for any DFI co-investment typically includes ≥50% independent directors.",
      },
      {
        category: "Environmental",
        issue: "Biodiversity Net Gain",
        severity: "Low",
        opportunity: true,
        detail:
          "Biodiversity corridors and HCV area management could generate verified biodiversity credits under emerging frameworks (SBTN, Article 6).",
      },
      {
        category: "Social",
        issue: "Smallholder Sustainability Uplift",
        severity: "Low",
        opportunity: true,
        detail:
          "Extending RSPO certification to independent smallholders in supply base creates market access to premium sustainability-linked buyers.",
      },
    ],
    valueUplift: [
      {
        area: "EUDR Traceability System",
        potential: "High",
        description:
          "Invest in satellite-linked supply chain traceability platform to achieve full EUDR compliance and protect EU revenue stream. Also unlocks Japan/Korea sustainability premiums.",
      },
      {
        area: "Biodiversity Credits",
        potential: "Medium",
        description:
          "HCV areas and conservation corridors adjacent to Maliau Basin could generate SBTN-aligned biodiversity credits. Nascent market but growing institutional buyer base.",
      },
      {
        area: "Sustainable Commodity Premium",
        potential: "High",
        description:
          "RSPO P&C 2018 + EUDR compliance enables US$50-80/MT premium over conventional palm oil in European and Japanese markets.",
      },
    ],
    engagement: [
      {
        date: "2025-03-05",
        type: "Site Visit",
        topic: "Concession Mapping & HCV Assessment Review",
        status: "Completed",
        notes:
          "Visited Sabah concessions. HCV completion on track. Boundary dispute with adjacent smallholder resolved. EUDR geo-coordinates submission on track for Q3.",
      },
      {
        date: "2025-07-14",
        type: "Meeting",
        topic: "TNFD Pilot Scope Review",
        status: "Completed",
        notes:
          "GreenHarvest among first ASEAN agribusiness companies to complete TNFD LEAP assessment. Results to be published in 2025 sustainability report.",
      },
      {
        date: "2025-12-01",
        type: "Report Review",
        topic: "EUDR Compliance Verification",
        status: "Overdue",
        notes:
          "EUDR compliance preparation behind schedule — third-party verifier had not been appointed by the internal Q4 2025 target. Issue escalated to emergency review in June 2026 (see below). Regulatory enforcement deadline is 30 December 2026.",
      },
      {
        date: "2026-06-10",
        type: "Meeting",
        topic: "EUDR Compliance Status — Emergency Review",
        status: "Completed",
        notes:
          "Compliance verifier (Bureau Veritas) appointed May 2026, audit scope agreed. Full geo-coordinates submitted for 94% of concessions; 6% of third-party supplier plots still outstanding. EU buyer Unilever has granted 90-day grace period. Audit completion target September 2026. Revenue at risk: est. S$52M if EU market access suspended.",
      },
      {
        date: "2026-09-30",
        type: "Report Review",
        topic: "Bureau Veritas EUDR Audit — Final Report Review",
        status: "Planned",
        notes:
          "Review Bureau Veritas audit completion. Confirm EUDR compliance certificate issued. Assess residual 6% third-party supplier gaps and remediation plan. Confirm Unilever and other EU buyers' continued access. Discuss SBTi near-term targets submission timeline for Q4 2026.",
      },
    ],
    investmentValue: 340,
    carbonIntensity: 185,
    greenRevenuePct: 34,
    lastUpdated: "2026-06-10",
    sdgAlignment: [
      { sdg: 2, label: "Zero Hunger" },
      { sdg: 13, label: "Climate Action" },
      { sdg: 15, label: "Life on Land" },
    ],
    netZeroCommitment: "SBTi Committed",
    boardComposition: {
      boardSize: 8,
      independentPct: 38,
      womenPct: 25,
      ceoChairSplit: false,
      auditCommittee: true,
      esgCommittee: false,
    },
    historicalScores: [
      { period: "Q1 2024", e: 45, s: 56, g: 58 },
      { period: "Q2 2024", e: 40, s: 57, g: 61 },
      { period: "Q3 2024", e: 42, s: 60, g: 62 },
      { period: "Q4 2024", e: 46, s: 62, g: 64 },
      { period: "Q1 2025", e: 49, s: 63, g: 65 },
      { period: "Q2 2025", e: 46, s: 63, g: 66 },
      { period: "Q3 2025", e: 50, s: 64, g: 67 },
      { period: "Q4 2025", e: 48, s: 62, g: 64 },
      { period: "Q1 2026", e: 49, s: 63, g: 65 },
      { period: "Q2 2026", e: 49, s: 63, g: 65 },
    ],
  },
  {
    slug: "asiapower-energy",
    name: "AsiaPower Energy",
    sector: "Electric Utilities & Energy Transition",
    sasbCategory: "Electric Utilities & Power Generators",
    country: "Indonesia",
    region: "Southeast Asia",
    description:
      "An Indonesian independent power producer operating a mixed portfolio of coal, gas, geothermal, and early-stage solar assets across Java, Sumatra, and Sulawesi, actively transitioning towards renewables under Indonesia's JETP commitments.",
    portfolioStatus: "Active",
    temasekMegatrend: "Climate Transition",
    esgScore: {
      overall: 46,
      environmental: 32,
      social: 55,
      governance: 52,
      rating: "BB",
    },
    maturity: "Developing",
    climateRisk: {
      physical: "Medium",
      transition: "Critical",
      physicalDetails: [
        "Geothermal assets in Sumatra exposed to seismic risk (high geological activity)",
        "Hydro-dependent cooling systems at thermal plants face water availability risk under drought scenarios",
      ],
      transitionDetails: [
        "4.2GW coal fleet faces stranded asset risk under Indonesia's JETP 2050 net zero pathway and accelerated coal phase-out (2040 target)",
        "Carbon pricing under Indonesia's cap-and-trade system (IDL/ETS) effective 2025 adds S$8-15/tonne cost to coal operations",
        "PLN offtake agreements for coal plants subject to renegotiation as government shifts procurement to renewables",
        "Transition risk to debt investors: S$3.2B in USD bonds with green covenants coming due 2027-2029",
      ],
      pathwayAlignment: "3°C+",
    },
    natureRisk: {
      overall: "Medium",
      biodiversityExposure: true,
      waterStress: true,
      deforestationRisk: false,
      tnfdAligned: false,
      details: [
        "Geothermal development in forested areas in Sumatra requires biodiversity offset planning",
        "Coal ash disposal at three legacy sites requires TNFD-aligned habitat restoration assessment",
      ],
      tnfdPillars: [
        { pillar: "Governance", status: "Gap" },
        { pillar: "Strategy", status: "Gap" },
        { pillar: "Risk & Impact Mgmt", status: "Gap" },
        { pillar: "Metrics & Targets", status: "Gap" },
      ],
    },
    materialIssues: [
      {
        category: "Environmental",
        issue: "Stranded Asset Risk (Coal Fleet)",
        severity: "Critical",
        opportunity: false,
        detail:
          "4.2GW coal represents 65% of current installed capacity. At-risk book value est. S$2.8B under 1.5°C scenario. JETP ETM mechanism offers partial mitigation.",
      },
      {
        category: "Environmental",
        issue: "Emissions Intensity",
        severity: "Critical",
        opportunity: false,
        detail:
          "Generation mix yields 712 gCO2/kWh — double the IEA 2030 target for ASEAN grids on a Paris-aligned pathway.",
      },
      {
        category: "Social",
        issue: "Just Transition",
        severity: "High",
        opportunity: false,
        detail:
          "12,000 direct employees in coal operations. Social plan for workforce transition required as accelerated coal phase-out proceeds. Community dependencies in East Kalimantan.",
      },
      {
        category: "Governance",
        issue: "Transition Strategy Credibility",
        severity: "High",
        opportunity: false,
        detail:
          "Published 2030 renewables target (40% of capacity) lacks interim milestones and capital allocation detail. Investor scrutiny growing.",
      },
      {
        category: "Governance",
        issue: "ESG Oversight Gap",
        severity: "Medium",
        opportunity: false,
        detail:
          "No board-level ESG committee despite holding Critical transition risk and two Critical material issues. Board-level ESG oversight is standard practice for energy transition companies and is required by most DFI co-investors including ADB and IFC. Required for credible JETP ETM application and green bond issuance.",
      },
      {
        category: "Environmental",
        issue: "Renewable Energy Pipeline",
        severity: "Low",
        opportunity: true,
        detail:
          "800MW geothermal pipeline in Sumatra is world-class resource. Indonesia holds 40% of global geothermal potential. Geothermal is anchor asset for credible transition.",
      },
    ],
    valueUplift: [
      {
        area: "JETP ETM Coal Retirement",
        potential: "High",
        description:
          "Early coal plant retirement under JETP Energy Transition Mechanism unlocks blended finance (ADB, AIIB, climate funds). Accelerates stranded asset write-down while accessing concessional capital.",
      },
      {
        area: "Geothermal Scale-Up",
        potential: "High",
        description:
          "800MW Sumatra geothermal pipeline + new Sulawesi prospects. Green bonds and multilateral financing available. Positions AsiaPower as ASEAN's leading geothermal developer.",
      },
      {
        area: "Just Transition Plan",
        potential: "Medium",
        description:
          "ILO-aligned Just Transition plan for coal workforce unlocks access to IFC and European DFI co-investment. Reduces regulatory and social licence risk in coal phase-out.",
      },
    ],
    engagement: [
      {
        date: "2025-04-22",
        type: "Meeting",
        topic: "Coal Phase-Out Timeline & JETP ETM",
        status: "Completed",
        notes:
          "Board agreed to commission independent JETP ETM feasibility for 3 coal plants (1.4GW). ADB advisory team to be engaged. ETM application target Q1 2026.",
      },
      {
        date: "2025-08-12",
        type: "Meeting",
        topic: "Geothermal Financing Strategy",
        status: "Overdue",
        notes:
          "Meeting missed — CFO travel conflict, rescheduled but not completed. Agenda was to review green bond issuance options for 400MW geothermal Phase 1 and assess B+ credit rating uplift pathway from green certification. Postponed to Q4 2025 but deprioritised as ETM application preparation took priority.",
      },
      {
        date: "2025-10-15",
        type: "Meeting",
        topic: "Just Transition Plan Scoping",
        status: "Completed",
        notes:
          "ILO-aligned workforce transition framework scoped for 3 coal plant sites (East Kalimantan). 12,000 direct employees mapped. Social plan draft commissioned — targeting Q1 2026 completion ahead of ETM application.",
      },
      {
        date: "2026-10-08",
        type: "Meeting",
        topic: "JETP ETM Application Status & Green Bond Roadshow",
        status: "Planned",
        notes: "Review ETM application progress for 3 coal plants (1.4GW). ADB feasibility report expected Q3 2026. If feasibility positive, target ETM application Q4 2026. Discuss green bond pre-marketing strategy for 400MW Sumatra geothermal Phase 1.",
      },
    ],
    investmentValue: 510,
    carbonIntensity: 4850,
    greenRevenuePct: 18,
    lastUpdated: "2026-06-10",
    sdgAlignment: [
      { sdg: 7, label: "Clean Energy" },
      { sdg: 8, label: "Decent Work" },
      { sdg: 13, label: "Climate Action" },
    ],
    netZeroCommitment: "None",
    boardComposition: {
      boardSize: 10,
      independentPct: 40,
      womenPct: 20,
      ceoChairSplit: true,
      auditCommittee: true,
      esgCommittee: false,
    },
    historicalScores: [
      { period: "Q1 2024", e: 25, s: 48, g: 44 },
      { period: "Q2 2024", e: 27, s: 50, g: 47 },
      { period: "Q3 2024", e: 29, s: 52, g: 47 },
      { period: "Q4 2024", e: 31, s: 53, g: 49 },
      { period: "Q1 2025", e: 32, s: 55, g: 52 },
      { period: "Q2 2025", e: 34, s: 56, g: 53 },
      { period: "Q3 2025", e: 35, s: 57, g: 52 },
      { period: "Q4 2025", e: 31, s: 54, g: 51 },
      { period: "Q1 2026", e: 31, s: 54, g: 51 },
      { period: "Q2 2026", e: 32, s: 55, g: 52 },
    ],
  },
  {
    slug: "medilink-health",
    name: "MediLink Health",
    sector: "Digital Health & Telehealth",
    sasbCategory: "Health Care Delivery",
    country: "Singapore",
    region: "Southeast Asia",
    description:
      "A Singapore-based digital health platform connecting patients to specialist care across Southeast Asia via AI-assisted triage, teleconsultation, and remote patient monitoring. Series C company targeting 50M+ uninsured ASEAN patients. Under evaluation for primary investment.",
    portfolioStatus: "Pipeline",
    temasekMegatrend: "Longer Lifespans",
    esgScore: {
      overall: 62,
      environmental: 58,
      social: 72,
      governance: 56,
      rating: "BBB",
    },
    maturity: "Developing",
    climateRisk: {
      physical: "Low",
      transition: "Low",
      physicalDetails: [
        "Data centres exposed to Singapore temperature increase — cooling cost uplift est. 5% by 2035",
      ],
      transitionDetails: [
        "Cloud infrastructure emissions (Scope 2) immaterial relative to healthcare impact value",
        "No significant regulatory climate risk for digital health sector",
      ],
      pathwayAlignment: "2°C",
    },
    natureRisk: {
      overall: "Low",
      biodiversityExposure: false,
      waterStress: false,
      deforestationRisk: false,
      tnfdAligned: false,
      details: [
        "Digital-only business model with no physical resource extraction dependencies",
      ],
      tnfdPillars: [
        { pillar: "Governance", status: "Gap" },
        { pillar: "Strategy", status: "Gap" },
        { pillar: "Risk & Impact Mgmt", status: "Gap" },
        { pillar: "Metrics & Targets", status: "Gap" },
      ],
    },
    materialIssues: [
      {
        category: "Social",
        issue: "Data Privacy & Patient Safety",
        severity: "High",
        opportunity: false,
        detail:
          "Handling of sensitive patient health data across 6 ASEAN jurisdictions requires compliance with PDPA (Singapore), PDPL (Indonesia), and forthcoming ASEAN data governance frameworks. One security incident in 2023 led to PDPC investigation.",
      },
      {
        category: "Governance",
        issue: "AI Algorithm Bias & Clinical Safety",
        severity: "High",
        opportunity: false,
        detail:
          "AI triage models trained primarily on Singapore patient cohort. Limited validation for Southeast Asian patient demographics, language diversity, and disease prevalence patterns. MAS FEAT Principles apply to AI components in financial products; MOH AI in Healthcare Framework relevant.",
      },
      {
        category: "Governance",
        issue: "Board & Governance Maturity",
        severity: "Medium",
        opportunity: false,
        detail:
          "Founder-led board with 2 of 5 directors classified as independent. Pre-IPO governance enhancement required: audit committee, ESG committee, whistleblower policy, and board diversity targets should be conditions of investment.",
      },
      {
        category: "Social",
        issue: "Health Access & Inclusion",
        severity: "Low",
        opportunity: true,
        detail:
          "Platform reaches 40M+ previously uninsured patients across Indonesia, Philippines, and Vietnam. Aligns directly with Temasek's inclusive growth mandate and Longer Lifespans megatrend. ADB Digital Finance Facility co-investment opportunity.",
      },
      {
        category: "Environmental",
        issue: "Digital Infrastructure Carbon Footprint",
        severity: "Low",
        opportunity: true,
        detail:
          "Cloud-first architecture enables rapid migration to low-carbon cloud providers. Singapore I-REC pathway available. Potential to market as 'carbon-neutral telehealth' — premium differentiator in European-funded global health programmes.",
      },
    ],
    valueUplift: [
      {
        area: "Inclusive Finance Integration",
        potential: "High",
        description:
          "Partner with Nusantara Bank (portfolio company) to offer embedded microinsurance and health savings products to MediLink's 40M+ patient base. Creates synergistic value across Temasek's portfolio aligned with inclusive growth mandate.",
      },
      {
        area: "Responsible AI Certification",
        potential: "High",
        description:
          "Achieve MOH AI in Healthcare accreditation and MAS FEAT compliance across financial health products. Positions MediLink as the only certified AI health platform in ASEAN — critical differentiator for government and insurer contracts.",
      },
      {
        area: "Carbon-Neutral Telehealth",
        potential: "Medium",
        description:
          "Achieve net zero Scope 1+2 by 2026 via I-REC + energy efficiency. Enables access to European development finance and WHO digital health partnership programmes that require ESG baseline standards.",
      },
    ],
    engagement: [
      {
        date: "2026-04-08",
        type: "Meeting",
        topic: "Initial ESG Due Diligence — Data Privacy & AI Governance",
        status: "Completed",
        notes:
          "Deal team and ESG Investment Management met MediLink CTO and CPO. Data privacy remediation plan post-2023 PDPC incident reviewed — adequate. AI bias testing protocol exists but covers Singapore cohort only; Indonesia and Vietnam validation gap confirmed. Board enhancement committed as investment condition.",
      },
      {
        date: "2026-07-20",
        type: "Call",
        topic: "ESG Conditions Precedent Review",
        status: "Planned",
        notes:
          "Pre-close review of agreed ESG conditions: (1) appointment of independent audit committee chair, (2) PDPA cross-border data transfer policy updated, (3) AI bias testing scope expanded to include Indonesian patient cohort.",
      },
    ],
    investmentValue: 95,
    carbonIntensity: 12,
    greenRevenuePct: 5,
    lastUpdated: "2026-04-08",
    sdgAlignment: [
      { sdg: 3, label: "Good Health" },
      { sdg: 10, label: "Reduced Inequalities" },
    ],
    netZeroCommitment: "Net Zero Pledged",
    boardComposition: {
      boardSize: 5,
      independentPct: 40,
      womenPct: 20,
      ceoChairSplit: false,
      auditCommittee: false,
      esgCommittee: false,
    },
    historicalScores: [
      { period: "Q3 2025", e: 52, s: 68, g: 52 },
      { period: "Q4 2025", e: 54, s: 70, g: 54 },
      { period: "Q1 2026", e: 56, s: 71, g: 55 },
      { period: "Q2 2026", e: 58, s: 72, g: 56 },
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
];

export const getCompanyBySlug = (slug: string): Company | undefined =>
  companies.find((c) => c.slug === slug);
