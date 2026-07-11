export interface Megatrend {
  slug: string;
  title: string;
  subtitle: string;
  temasekAlignment: string;
  urgency: "Immediate" | "Near-term" | "Long-term";
  color: string;
  summary: string;
  keyStats: { label: string; value: string; source: string }[];
  investmentImplications: { type: "Risk" | "Opportunity"; sector: string; description: string }[];
  frameworks: string[];
  portfolioExposure: { slug: string; name: string; exposure: "High" | "Medium" | "Low" }[];
}

export interface RegulatoryUpdate {
  id: string;
  title: string;
  jurisdiction: string;
  effectiveDate: string;
  status: "In Force" | "Effective 2026" | "Proposed" | "Consultation";
  category: "Climate Disclosure" | "Nature" | "Social" | "Governance" | "Taxonomy" | "Carbon Pricing";
  summary: string;
  investmentImpact: string;
  relevantSectors: string[];
  urgency: "High" | "Medium" | "Low";
  portfolioImpact?: string[]; // company slugs
}

export const megatrends: Megatrend[] = [
  {
    slug: "climate-transition",
    title: "Climate Transition",
    subtitle: "Net Zero & Physical Climate Risk",
    temasekAlignment: "Sustainable Living",
    urgency: "Immediate",
    color: "emerald",
    summary:
      "The accelerating energy transition and mounting physical climate impacts are reshaping the risk-return profile of every asset class. Companies on Paris-misaligned pathways face stranded assets, carbon pricing exposure, and capital market repricing. First movers in clean technology and climate solutions are capturing structural tailwinds.",
    keyStats: [
      { label: "Global clean energy investment (2024)", value: "$2.1 trillion", source: "IEA World Energy Investment 2024" },
      { label: "ASEAN renewable energy capacity target by 2035", value: "35% of mix", source: "IRENA ASEAN Outlook" },
      { label: "Indonesia JETP financing commitment", value: "$20 billion", source: "Indonesia JETP Secretariat" },
      { label: "Carbon price required for 1.5°C (2030)", value: "$147/tCO2", source: "IMF Carbon Price Monitor" },
      { label: "Temasek portfolio emissions reduction (to 2024)", value: "22%", source: "Temasek Sustainability Report 2024" },
    ],
    investmentImplications: [
      { type: "Risk", sector: "Energy", description: "Coal and high-carbon assets face accelerated stranded asset timelines as carbon pricing expands across ASEAN." },
      { type: "Risk", sector: "Real Estate", description: "Coastal and flood-zone assets face insurance withdrawal and value impairment under physical climate scenarios." },
      { type: "Opportunity", sector: "Energy", description: "ASEAN geothermal, offshore wind, and solar + storage represent multi-billion dollar uncrowded capital deployment opportunities." },
      { type: "Opportunity", sector: "Industrials", description: "Green hydrogen, methanol, and industrial decarbonisation technology scale-up requires patient institutional capital." },
      { type: "Opportunity", sector: "Finance", description: "Transition finance and blended finance instruments (ETMs, green bonds) are growing 40%+ p.a. in Southeast Asia." },
    ],
    frameworks: ["TCFD", "ISSB S2", "IPCC AR6", "SBTi", "IEA Net Zero Scenario"],
    portfolioExposure: [
      { slug: "asiapower-energy", name: "AsiaPower Energy", exposure: "High" },
      { slug: "seaport-logistics", name: "SeaPort Logistics", exposure: "High" },
      { slug: "nusantara-bank", name: "Nusantara Bank", exposure: "Medium" },
      { slug: "greenharvest-agri", name: "GreenHarvest Agri", exposure: "Medium" },
      { slug: "cloudmesh-technologies", name: "CloudMesh Technologies", exposure: "Low" },
      { slug: "medilink-health", name: "MediLink Health", exposure: "Low" },
    ],
  },
  {
    slug: "nature-biodiversity",
    title: "Nature & Biodiversity",
    subtitle: "TNFD, EUDR & Natural Capital",
    temasekAlignment: "Sustainable Living",
    urgency: "Near-term",
    color: "green",
    summary:
      "Half of global GDP is moderately or highly dependent on nature and ecosystem services. The TNFD framework (finalized September 2023) and the Kunming-Montreal Global Biodiversity Framework (GBF) are driving a new wave of nature-related disclosure requirements and creating both material risks and emerging opportunities in natural capital.",
    keyStats: [
      { label: "Global GDP dependent on nature", value: "$44 trillion", source: "WEF Nature Risk Rising 2020" },
      { label: "Species extinction rate vs. natural baseline", value: "1,000x faster", source: "IPBES Global Assessment" },
      { label: "EUDR-covered commodities EU import value", value: "€12 billion/yr", source: "European Commission" },
      { label: "Voluntary biodiversity credit market potential (2030)", value: "$2 billion", source: "BNEF Nature Market Outlook" },
      { label: "TNFD adopters globally (2025)", value: "500+", source: "TNFD Disclosure Platform" },
    ],
    investmentImplications: [
      { type: "Risk", sector: "Agriculture", description: "EUDR compliance requires full supply chain traceability for palm oil, soy, cattle, cocoa — affecting export revenues for non-compliant producers." },
      { type: "Risk", sector: "Finance", description: "Banks with forest-risk commodity lending face regulatory and reputational risk as TNFD disclosure becomes mandatory." },
      { type: "Risk", sector: "Consumer Goods", description: "Consumer brands sourcing from deforestation-linked supply chains face boycott and retailer delisting risk in European markets." },
      { type: "Opportunity", sector: "Agriculture", description: "RSPO/TNFD-compliant palm oil commands US$50-80/MT premium. Nature-positive certification unlocks premium sustainability buyers." },
      { type: "Opportunity", sector: "Finance", description: "Nature-based solutions finance, biodiversity credits, and debt-for-nature swaps are structurally undersupplied investment opportunities." },
    ],
    frameworks: ["TNFD LEAP", "GBF Kunming-Montreal", "EUDR", "SBTN", "RSPO P&C 2018"],
    portfolioExposure: [
      { slug: "greenharvest-agri", name: "GreenHarvest Agri", exposure: "High" },
      { slug: "nusantara-bank", name: "Nusantara Bank", exposure: "High" },
      { slug: "asiapower-energy", name: "AsiaPower Energy", exposure: "Medium" },
      { slug: "seaport-logistics", name: "SeaPort Logistics", exposure: "Low" },
      { slug: "cloudmesh-technologies", name: "CloudMesh Technologies", exposure: "Low" },
      { slug: "medilink-health", name: "MediLink Health", exposure: "Low" },
    ],
  },
  {
    slug: "just-transition",
    title: "Just Transition & Inclusive Growth",
    subtitle: "Social Equity in the Low-Carbon Economy",
    temasekAlignment: "Inclusive Growth",
    urgency: "Near-term",
    color: "orange",
    summary:
      "The transition to a net zero economy must be socially equitable to be sustainable. Temasek's mandate of 'inclusive growth' is directly aligned with the just transition imperative — ensuring that the shift away from fossil fuels does not leave workers, communities, and developing economies behind. Just transition risk is increasingly material to asset valuations.",
    keyStats: [
      { label: "Coal workers globally requiring reskilling", value: "10+ million", source: "ILO Just Transition Guidelines" },
      { label: "ASEAN social spending gap vs. OECD", value: "12% of GDP", source: "ADB Social Protection Outlook" },
      { label: "JETP social safeguards allocation (Indonesia)", value: "$400 million", source: "Indonesia JETP Secretariat" },
      { label: "Companies with Just Transition plans (S&P 500)", value: "18%", source: "Sustainalytics 2024" },
      { label: "Living wage gap in ASEAN manufacturing", value: "32-58% below living wage", source: "Wage Indicator Foundation 2024" },
    ],
    investmentImplications: [
      { type: "Risk", sector: "Energy", description: "Coal plant closures without credible social plans risk community conflict, regulatory delays, and reputational damage for investors." },
      { type: "Risk", sector: "Industrials", description: "Supply chains with labour rights violations face import bans (EU CSDDD) and buyer delisting, with direct revenue impact." },
      { type: "Opportunity", sector: "Finance", description: "Social and sustainability-linked bonds with just transition use of proceeds are growing rapidly. DFI co-investment available." },
      { type: "Opportunity", sector: "Technology", description: "Digital reskilling platforms and inclusive fintech solutions aligned with ASEAN's 150M unbanked population represent large unserved markets." },
      { type: "Opportunity", sector: "Healthcare", description: "Affordable healthcare access in Southeast Asia (Temasek megatrend: Longer Lifespans) is a structural growth opportunity." },
    ],
    frameworks: ["ILO Just Transition Guidelines", "UN SDGs (SDG 8, 10)", "EU CSDDD", "GRI 414: Supplier Social Assessment"],
    portfolioExposure: [
      { slug: "asiapower-energy", name: "AsiaPower Energy", exposure: "High" },
      { slug: "nusantara-bank", name: "Nusantara Bank", exposure: "Medium" },
      { slug: "greenharvest-agri", name: "GreenHarvest Agri", exposure: "High" },
      { slug: "seaport-logistics", name: "SeaPort Logistics", exposure: "Medium" },
      { slug: "medilink-health", name: "MediLink Health", exposure: "Medium" },
      { slug: "cloudmesh-technologies", name: "CloudMesh Technologies", exposure: "Low" },
    ],
  },
  {
    slug: "ai-digital-ethics",
    title: "AI & Digital Ethics",
    subtitle: "Responsible Technology in the Digital Economy",
    temasekAlignment: "Digitisation",
    urgency: "Immediate",
    color: "blue",
    summary:
      "Artificial intelligence is reshaping every sector of the economy, creating enormous value but also systemic risks — from algorithmic bias and data privacy to energy consumption and cybersecurity. As Temasek deploys capital into digital infrastructure and technology companies, responsible AI governance and digital sustainability are core to long-term value protection.",
    keyStats: [
      { label: "Global AI market value (2030 projected)", value: "$1.8 trillion", source: "PwC Global AI Report 2024" },
      { label: "Data centre electricity demand increase by 2030", value: "+160%", source: "IEA Electricity 2024" },
      { label: "AI governance regulations enacted globally (2024)", value: "80+ jurisdictions", source: "OECD AI Policy Observatory" },
      { label: "Cybersecurity incidents costing >$1M (2023)", value: "Up 11% YoY", source: "IBM Cost of a Data Breach 2024" },
      { label: "Singapore digital economy as % of GDP", value: "17%", source: "MAS FinTech Report 2024" },
    ],
    investmentImplications: [
      { type: "Risk", sector: "Technology (AI Governance)", description: "AI companies without published ethics policies and governance frameworks face EU AI Act compliance penalties and enterprise customer loss." },
      { type: "Risk", sector: "Finance", description: "Algorithmic trading and credit scoring models face rising regulatory scrutiny under MAS FEAT and EU AI Act for explainability." },
      { type: "Risk", sector: "Technology (Infrastructure)", description: "Data centre energy demand surge creates Scope 2 emission risks and reputational exposure for cloud providers without credible RE plans." },
      { type: "Opportunity", sector: "Technology", description: "Enterprise AI governance tools, audit platforms, and compliance software represent a $30B+ market as AI regulation proliferates." },
      { type: "Opportunity", sector: "Industrials", description: "AI-optimised energy management and predictive maintenance create measurable decarbonisation ROI for heavy industry." },
    ],
    frameworks: ["MAS FEAT Principles", "EU AI Act", "NIST AI RMF", "ISO 42001 (AI Management Systems)", "Singapore Model AI Governance Framework"],
    portfolioExposure: [
      { slug: "cloudmesh-technologies", name: "CloudMesh Technologies", exposure: "High" },
      { slug: "medilink-health", name: "MediLink Health", exposure: "High" },
      { slug: "nusantara-bank", name: "Nusantara Bank", exposure: "Medium" },
      { slug: "seaport-logistics", name: "SeaPort Logistics", exposure: "Low" },
      { slug: "greenharvest-agri", name: "GreenHarvest Agri", exposure: "Low" },
      { slug: "asiapower-energy", name: "AsiaPower Energy", exposure: "Low" },
    ],
  },
  {
    slug: "longer-lifespans",
    title: "Longer Lifespans",
    subtitle: "Ageing Populations & Health Equity in Asia",
    temasekAlignment: "Healthcare & Inclusive Access",
    urgency: "Long-term",
    color: "purple",
    summary:
      "Asia's rapidly ageing population is creating structural demand for healthcare, eldercare, and preventive wellness. By 2050, one in four Asians will be over 60. This demographic megatrend drives investment opportunity in health systems, digital health, and longevity-linked sectors — while creating material ESG risks for companies dependent on young, low-cost labour and for pension-exposed financial institutions.",
    keyStats: [
      { label: "Asia population over 60 by 2050", value: "1.3 billion", source: "UN World Population Prospects 2022" },
      { label: "ASEAN healthcare market size (2025)", value: "$740 billion", source: "Frost & Sullivan ASEAN Healthcare" },
      { label: "Singapore healthcare spending as % of GDP", value: "5.6%", source: "MOH Singapore 2023" },
      { label: "Digital health market APAC (2027 projected)", value: "$162 billion", source: "Statista Digital Health APAC 2024" },
      { label: "Unmet eldercare need in Southeast Asia", value: "73% of elderly", source: "ADB Ageing Report 2024" },
    ],
    investmentImplications: [
      { type: "Opportunity", sector: "Healthcare", description: "Chronic disease management, preventive care, and medtech are structurally undersupplied across ASEAN as populations age faster than health systems expand." },
      { type: "Opportunity", sector: "Technology", description: "Digital health platforms, telemedicine, and AI-assisted diagnostics are scaling rapidly to address access gaps in rural ASEAN markets." },
      { type: "Opportunity", sector: "Finance", description: "Longevity-linked financial products (annuities, retirement savings, reverse mortgages) face structural demand growth from ASEAN's emerging middle class." },
      { type: "Risk", sector: "Consumer Goods", description: "Companies with youth-dependent consumption models face long-term market contraction in ageing economies like Japan, South Korea, and increasingly Singapore." },
      { type: "Risk", sector: "Industrials", description: "Labour-intensive industries face productivity headwinds and rising social security costs as working-age populations shrink across North and Southeast Asia." },
    ],
    frameworks: ["UN SDG 3 (Good Health)", "WHO Healthy Ageing Framework", "ISSB S1 (Human Capital)", "GRI 403 (Occupational Health)"],
    portfolioExposure: [
      { slug: "medilink-health", name: "MediLink Health", exposure: "High" },
      { slug: "nusantara-bank", name: "Nusantara Bank", exposure: "Medium" },
      { slug: "cloudmesh-technologies", name: "CloudMesh Technologies", exposure: "Medium" },
      { slug: "greenharvest-agri", name: "GreenHarvest Agri", exposure: "Low" },
      { slug: "seaport-logistics", name: "SeaPort Logistics", exposure: "Low" },
      { slug: "asiapower-energy", name: "AsiaPower Energy", exposure: "Low" },
    ],
  },
];

export const regulatoryUpdates: RegulatoryUpdate[] = [
  {
    id: "sgx-issb-2025",
    title: "SGX Mandatory ISSB-aligned Climate Disclosure",
    jurisdiction: "Singapore",
    effectiveDate: "FY2025",
    status: "In Force",
    category: "Climate Disclosure",
    summary:
      "SGX RegCo mandates ISSB S1/S2-aligned sustainability reporting for all large listed companies (top 100 by market cap) for financial years beginning 2025. Phased rollout to all listed companies by FY2027.",
    investmentImpact:
      "Listed portfolio companies must report climate risks, opportunities, and metrics under ISSB S1/S2. Unlisted portfolio companies should prepare voluntarily to avoid disclosure readiness gap at IPO.",
    relevantSectors: ["All listed companies", "Financial Services", "Energy", "Real Estate"],
    urgency: "High",
    portfolioImpact: ["seaport-logistics", "cloudmesh-technologies", "medilink-health"],
  },
  {
    id: "mas-gfap-2-0",
    title: "MAS Green Finance Action Plan 2.0",
    jurisdiction: "Singapore",
    effectiveDate: "2023 (ongoing)",
    status: "In Force",
    category: "Taxonomy",
    summary:
      "MAS's second-generation green finance framework includes the Singapore-Asia Taxonomy for Sustainable Finance, green and sustainability-linked loan principles, and grant schemes for transition finance. FAST-P ($5B blended finance) targets ASEAN energy transition.",
    investmentImpact:
      "Singapore-Asia Taxonomy defines what counts as 'green' for regulatory capital treatment. FAST-P creates blended finance co-investment opportunities with MAS for ASEAN clean energy deals.",
    relevantSectors: ["Banking", "Energy", "Infrastructure", "Real Estate"],
    urgency: "High",
    portfolioImpact: ["nusantara-bank", "seaport-logistics", "cloudmesh-technologies"],
  },
  {
    id: "eudr-2025",
    title: "EU Deforestation Regulation (EUDR)",
    jurisdiction: "European Union",
    effectiveDate: "December 2026",
    status: "Effective 2026",
    category: "Nature",
    summary:
      "Prohibits placing commodities (palm oil, soy, cattle, wood, cocoa, coffee, rubber) on the EU market if produced on deforested land after December 2020. Requires geo-coordinates and due diligence statements. Originally effective December 2024, delayed to December 2025, then delayed again to 30 December 2026 for large/medium operators (30 June 2027 for small operators) following EU Omnibus review.",
    investmentImpact:
      "Material revenue risk for ASEAN agribusiness companies with EU export exposure. Also creates second-order credit risk in bank loan books with forest-risk commodity exposure.",
    relevantSectors: ["Agriculture", "Commercial Banking", "Consumer Goods", "Logistics"],
    urgency: "High",
    portfolioImpact: ["greenharvest-agri", "nusantara-bank"],
  },
  {
    id: "indonesia-ets-2025",
    title: "Indonesia Emissions Trading System (IDL/ETS)",
    jurisdiction: "Indonesia",
    effectiveDate: "2025",
    status: "In Force",
    category: "Carbon Pricing",
    summary:
      "Indonesia's national cap-and-trade system expanded to cover coal power plants in 2025, with gradual expansion to industrial sectors. Carbon price expected to reach $5-15/tCO2e initially.",
    investmentImpact:
      "Direct cost impact on coal power and industrial portfolio companies in Indonesia. Strengthens investment case for renewables transition.",
    relevantSectors: ["Electric Utilities", "Industrials", "Mining"],
    urgency: "High",
    portfolioImpact: ["asiapower-energy"],
  },
  {
    id: "issb-s1-s2-global",
    title: "ISSB S1 & S2 Global Baseline Standards",
    jurisdiction: "Global (adopted by 30+ jurisdictions)",
    effectiveDate: "FY2024+ (jurisdiction-dependent)",
    status: "In Force",
    category: "Climate Disclosure",
    summary:
      "IFRS S1 (general sustainability disclosures) and S2 (climate-specific) establish the global baseline for corporate sustainability reporting. SASB Standards provide the sector-specific materiality toolkit within S1.",
    investmentImpact:
      "Creates consistent, comparable ESG data for all portfolio companies globally. Investment-grade ESG analysis increasingly requires ISSB-aligned data.",
    relevantSectors: ["All sectors"],
    urgency: "Medium",
    portfolioImpact: ["seaport-logistics", "nusantara-bank", "cloudmesh-technologies", "greenharvest-agri", "asiapower-energy", "medilink-health"],
  },
  {
    id: "tnfd-adoption",
    title: "TNFD Nature-related Disclosures (v1.0)",
    jurisdiction: "Global (voluntary, adopted by 500+ companies)",
    effectiveDate: "September 2023",
    status: "In Force",
    category: "Nature",
    summary:
      "TNFD final recommendations provide a TCFD-equivalent framework for nature-related financial disclosures across four pillars: Governance, Strategy, Risk & Impact Management, Metrics & Targets. LEAP assessment methodology for nature dependency and impact.",
    investmentImpact:
      "Companies adopting TNFD early gain advantage in nature-sensitive supply chains and access to nature-positive financing. Non-adopters face growing investor scrutiny.",
    relevantSectors: ["Agriculture", "Mining", "Real Estate", "Banking", "Consumer Goods"],
    urgency: "Medium",
    portfolioImpact: ["greenharvest-agri", "nusantara-bank", "asiapower-energy", "seaport-logistics"],
  },
  {
    id: "malaysia-bursa-sustainability",
    title: "Bursa Malaysia Enhanced Sustainability Reporting",
    jurisdiction: "Malaysia",
    effectiveDate: "FY2024",
    status: "In Force",
    category: "Climate Disclosure",
    summary:
      "Bursa Malaysia mandates TCFD-aligned climate disclosures for Main Market large cap companies. ISSB alignment to follow SGX timeline. Scope 3 reporting guidance issued for high-impact sectors.",
    investmentImpact:
      "Malaysian portfolio companies (including GreenHarvest Agri if listed) need enhanced TCFD disclosures with climate scenario analysis.",
    relevantSectors: ["All Malaysian listed companies", "Agriculture", "Energy"],
    urgency: "Medium",
    portfolioImpact: ["greenharvest-agri"],
  },
  {
    id: "singapore-green-plan-2030",
    title: "Singapore Green Plan 2030",
    jurisdiction: "Singapore",
    effectiveDate: "2021 (ongoing)",
    status: "In Force",
    category: "Governance",
    summary:
      "Singapore's national sustainable development roadmap with five pillars: City in Nature, Energy Reset, Sustainable Living, Green Economy, Resilient Future. Key targets: 80% of buildings to be BCA Green Mark certified, quadruple solar capacity, all new vehicles clean energy by 2030.",
    investmentImpact:
      "Creates policy tailwinds for green building, clean energy, urban mobility, and circular economy investments in Singapore. Aligns government procurement with sustainable suppliers.",
    relevantSectors: ["Real Estate", "Energy", "Transport", "Construction", "Technology"],
    urgency: "Low",
    portfolioImpact: ["cloudmesh-technologies", "seaport-logistics"],
  },
  {
    id: "pdpa-asean-digital",
    title: "PDPA Amendment & Indonesia PDPL — Cross-Border Health Data",
    jurisdiction: "Indonesia / Singapore",
    effectiveDate: "September 2024",
    status: "In Force",
    category: "Social",
    summary:
      "Singapore's Personal Data Protection Act (PDPA) 2020 amendments strengthen consent requirements and data portability rules. Indonesia's Personal Data Protection Law (UU PDP/PDPL), effective September 2024, introduces strict cross-border data transfer restrictions and mandatory data protection officers. Critical for digital health platforms processing patient data across ASEAN.",
    investmentImpact:
      "Digital health, fintech, and any portfolio or pipeline company processing personal data across Singapore-Indonesia must ensure PDPL-compliant data localisation or approved transfer mechanisms. Non-compliance carries fines up to 2% of global annual turnover and potential service suspension.",
    relevantSectors: ["Technology", "Digital Health", "Banking", "Insurance"],
    urgency: "High",
    portfolioImpact: ["medilink-health", "nusantara-bank", "cloudmesh-technologies"],
  },
  {
    id: "eu-cbam-2026",
    title: "EU Carbon Border Adjustment Mechanism (CBAM) — Permanent Phase",
    jurisdiction: "European Union",
    effectiveDate: "January 2026",
    status: "In Force",
    category: "Carbon Pricing",
    summary:
      "CBAM's permanent phase began January 2026, requiring EU importers of steel, aluminium, cement, fertilisers, electricity, and hydrogen to purchase CBAM certificates at the prevailing EU ETS carbon price (currently ~€65-75/tCO2e). CBAM expands to additional downstream manufactured goods from 2030, with ongoing reviews of sector scope.",
    investmentImpact:
      "ASEAN industrial exporters to the EU face rising embedded carbon costs, creating pressure on high-carbon production processes. SeaPort's EU-bound cargo flows will face freight rate pressure as cargo owners internalise CBAM costs. Companies with EU trade exposure that haven't decarbonised their production face both direct cost and margin risk.",
    relevantSectors: ["Marine Transport", "Industrials", "Manufacturing", "Energy"],
    urgency: "Medium",
    portfolioImpact: ["seaport-logistics"],
  },
];

export const getMegatrendBySlug = (slug: string): Megatrend | undefined =>
  megatrends.find((m) => m.slug === slug);
