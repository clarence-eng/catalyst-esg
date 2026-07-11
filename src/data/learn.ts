export interface FrameworkCard {
  id: string;
  name: string;
  fullName: string;
  category: "Climate" | "Nature" | "Social" | "Cross-cutting" | "Reporting";
  status: "Mandatory" | "Voluntary" | "Emerging";
  adoptionYear: string;
  description: string;
  investmentRelevance: string;
  keyRequirements: string[];
  aseanContext: string;
  url: string;
  temasekRelevance: "High" | "Medium" | "Low";
}

export interface CaseStudy {
  id: string;
  title: string;
  company: string;
  sector: string;
  region: string;
  theme: "Climate Transition" | "Nature & Biodiversity" | "Just Transition" | "Governance" | "Sustainable Finance";
  summary: string;
  outcome: string;
  lessonLearned: string;
  frameworks: string[];
  year: string;
}

export const frameworks: FrameworkCard[] = [
  {
    id: "tcfd",
    name: "TCFD",
    fullName: "TCFD (disbanded Oct 2023 → ISSB S2) — Task Force on Climate-related Financial Disclosures",
    category: "Climate",
    status: "Mandatory",
    adoptionYear: "2017",
    description:
      "The TCFD framework — developed by the FSB Task Force — provides a structure for companies to disclose climate-related risks and opportunities across four pillars: Governance, Strategy, Risk Management, and Metrics & Targets. TCFD was formally disbanded in October 2023 as its architecture was absorbed into the mandatory ISSB S2 standard. Its four-pillar structure is now effectively mandated for SGX-listed companies via ISSB S2 (FY2025).",
    investmentRelevance:
      "TCFD disclosure is now mandatory for SGX-listed companies under ISSB S2 (from FY2025). It provides the primary lens for assessing whether portfolio companies are managing climate risk systematically and quantifying potential financial impacts.",
    keyRequirements: [
      "Board and management oversight of climate risks",
      "Climate scenario analysis (1.5°C, 2°C, 3°C+ pathways)",
      "Physical and transition risk identification",
      "Scope 1, 2, and 3 emissions disclosure",
      "Climate-related targets and metrics",
    ],
    aseanContext:
      "SGX mandated TCFD-aligned reporting from FY2022 for top 100 listed companies. MAS embedded TCFD in its Green Finance Action Plan. Indonesia, Malaysia, and Thailand are phasing in TCFD requirements through respective regulators.",
    url: "https://www.ifrs.org/sustainability/tcfd/",
    temasekRelevance: "High",
  },
  {
    id: "tnfd",
    name: "TNFD",
    fullName: "Taskforce on Nature-related Financial Disclosures",
    category: "Nature",
    status: "Voluntary",
    adoptionYear: "2023",
    description:
      "TNFD (final recommendations September 2023) provides a TCFD-equivalent framework for nature-related financial disclosures using the LEAP methodology (Locate, Evaluate, Assess, Prepare). Over 500 organisations globally have committed to TNFD-aligned reporting (2025).",
    investmentRelevance:
      "Critical for ASEAN portfolios with agriculture, forestry, and extractives exposure. Banks with forest-risk commodity lending face growing scrutiny. Nature-positive strategies create access to blended finance from DFIs requiring TNFD alignment.",
    keyRequirements: [
      "LEAP assessment: identify nature dependencies and impacts",
      "Biodiversity footprint and target setting",
      "Supply chain nature risk mapping",
      "SBTN (Science-Based Targets for Nature) alignment",
      "GBF Kunming-Montreal 30x30 target consideration",
    ],
    aseanContext:
      "ASEAN holds 20% of global biodiversity. EUDR enforcement creates immediate compliance pressure for SEA agribusiness. GreenHarvest Agri is piloting TNFD LEAP — one of the first ASEAN agribusiness companies to do so.",
    url: "https://tnfd.global",
    temasekRelevance: "High",
  },
  {
    id: "issb",
    name: "ISSB S1/S2",
    fullName: "IFRS Sustainability Disclosure Standards (ISSB)",
    category: "Reporting",
    status: "Mandatory",
    adoptionYear: "2023",
    description:
      "ISSB S1 (general sustainability disclosures) and S2 (climate-specific) establish the global baseline for corporate sustainability reporting. S1 references SASB Standards for sector-specific material topics. Adopted by 30+ jurisdictions including Singapore (FY2025), UK, Australia, Canada.",
    investmentRelevance:
      "Creates a consistent, comparable ESG data infrastructure across listed portfolio companies globally. Investment-grade ESG analysis increasingly requires ISSB-aligned data. Unlisted companies should prepare voluntarily ahead of IPO.",
    keyRequirements: [
      "Connectivity between financial and sustainability statements",
      "Sustainability-related risks and opportunities affecting enterprise value",
      "Climate scenario analysis under S2",
      "Value chain (Scope 3) emissions under S2",
      "SASB Standards for sector-specific materiality",
    ],
    aseanContext:
      "SGX RegCo mandates ISSB S1/S2 for large listed companies from FY2025. Bursa Malaysia aligning with ISSB timeline. MAS guidance on ISSB adoption for financial institutions expected in 2026.",
    url: "https://www.ifrs.org/groups/international-sustainability-standards-board",
    temasekRelevance: "High",
  },
  {
    id: "sasb",
    name: "SASB",
    fullName: "Sustainability Accounting Standards Board Standards",
    category: "Reporting",
    status: "Mandatory",
    adoptionYear: "2018",
    description:
      "SASB Standards (now maintained by ISSB/IFRS Foundation) identify the subset of ESG issues most likely to be financially material for 77 specific industries. They provide the sector-specific materiality toolkit used within ISSB S1.",
    investmentRelevance:
      "Essential for ESG due diligence. Rather than applying a generic ESG checklist, SASB identifies which issues matter most for a given sector — e.g. water management for agriculture, data security for software, fleet emissions for marine transport.",
    keyRequirements: [
      "Industry-specific disclosure topics and accounting metrics",
      "Financial materiality determination by sector",
      "77 industry standards across 11 sector categories",
    ],
    aseanContext:
      "SASB is widely used by Temasek, GIC, and ASEAN institutional investors as a due diligence framework. Integration with ISSB S1 means SASB familiarity is now a baseline expectation for ESG analysts.",
    url: "https://sasb.ifrs.org",
    temasekRelevance: "High",
  },
  {
    id: "sbti",
    name: "SBTi",
    fullName: "Science-Based Targets Initiative",
    category: "Climate",
    status: "Voluntary",
    adoptionYear: "2015",
    description:
      "SBTi enables companies to set emissions reduction targets aligned with climate science — specifically the 1.5°C pathway. Targets must cover Scope 1, 2, and material Scope 3. The SBTi for Financial Institutions (SBTi for FIs) provides equivalent methodology for financial institutions' financed emissions.",
    investmentRelevance:
      "SBTi targets are increasingly required by institutional investors and MNC buyers as a condition for supply chain qualification. Companies without SBTi face procurement risk. For portfolio companies, SBTi adoption signals strategic alignment and unlocks ESG-linked financing.",
    keyRequirements: [
      "Near-term targets (5–10 year) aligned to 1.5°C",
      "Long-term net zero target by 2050",
      "Scope 3 coverage for high-impact sectors",
      "Annual progress reporting",
    ],
    aseanContext:
      "SBTi adoption is growing in ASEAN but remains low compared to Europe. Early movers gain competitive differentiation in European export markets and MAS-facilitated ESG-linked loans.",
    url: "https://sciencebasedtargets.org",
    temasekRelevance: "High",
  },
  {
    id: "eudr",
    name: "EUDR",
    fullName: "EU Deforestation Regulation",
    category: "Nature",
    status: "Mandatory",
    adoptionYear: "2023",
    description:
      "EUDR prohibits placing key commodities (palm oil, soy, cattle, wood, cocoa, coffee, rubber, and derived products) on the EU market if produced on land deforested after December 2020. Requires geo-coordinates and due diligence statements from operators. Enforcement deadline: 30 December 2026 for large/medium operators, 30 June 2027 for small operators (delayed twice from the original December 2024 date).",
    investmentRelevance:
      "Direct revenue risk for ASEAN agribusiness with EU export exposure. Second-order credit risk for banks lending to non-compliant commodity producers. GreenHarvest Agri's EU revenue (22% of total) is directly at risk without full compliance.",
    keyRequirements: [
      "Geo-coordinates for all production plots",
      "Proof of deforestation-free status post-December 2020",
      "Supply chain due diligence statements",
      "Risk-based operator classification",
    ],
    aseanContext:
      "Indonesia and Malaysia (world's two largest palm oil producers) are both subject to EUDR. The regulation is creating significant supply chain restructuring. ASEAN governments have engaged EU on implementation modalities.",
    url: "https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en",
    temasekRelevance: "High",
  },
  {
    id: "mas-gfap",
    name: "MAS GFAP",
    fullName: "MAS Green Finance Action Plan (Singapore)",
    category: "Cross-cutting",
    status: "Mandatory",
    adoptionYear: "2021",
    description:
      "MAS's Green Finance Action Plan (GFAP, with GFAP 2.0 in 2023) is Singapore's framework for developing green finance markets. Key components: Singapore-Asia Taxonomy for Sustainable Finance, ESG data and disclosure requirements, grant schemes, and the FAST-P ($5B) blended finance vehicle for ASEAN energy transition.",
    investmentRelevance:
      "Singapore-Asia Taxonomy defines what counts as 'green' for MAS-regulated institutions, affecting capital treatment and ESG-labelled product eligibility. FAST-P creates blended finance co-investment opportunities with MAS for ASEAN clean energy deals.",
    keyRequirements: [
      "Singapore-Asia Taxonomy alignment for green products",
      "ESG disclosure for MAS-regulated financial institutions",
      "Climate risk stress testing for banks and insurers",
    ],
    aseanContext:
      "Singapore is the primary green finance hub for ASEAN. MAS chairs the ASEAN Sustainable Finance Taxonomy Working Group, which aligns regional taxonomies. FAST-P is a direct co-investment vehicle relevant to Temasek deal flow.",
    url: "https://www.mas.gov.sg/development/sustainable-finance",
    temasekRelevance: "High",
  },
  {
    id: "gri",
    name: "GRI Standards",
    fullName: "Global Reporting Initiative Standards",
    category: "Reporting",
    status: "Voluntary",
    adoptionYear: "2016",
    description:
      "GRI Standards are the world's most widely used framework for sustainability reporting, focused on impacts (rather than financial materiality). GRI 300 series covers Environmental, GRI 400 covers Social. Often used alongside ISSB/TCFD to provide a full impact + financial materiality picture.",
    investmentRelevance:
      "GRI remains the baseline for portfolio company sustainability report quality assessment. Key sector standards (GRI 403 for occupational health, GRI 414 for supply chain social) are used in ESG engagement to benchmark company disclosure quality.",
    keyRequirements: [
      "Impact materiality determination (double materiality)",
      "GRI Universal Standards (governance, strategy, policies)",
      "Topic-specific standards for material impacts",
    ],
    aseanContext:
      "GRI is widely adopted across ASEAN markets. Increasingly used alongside ISSB — EU CSRD and some ASEAN regulators require double materiality (GRI) plus financial materiality (ISSB).",
    url: "https://www.globalreporting.org",
    temasekRelevance: "High",
  },
  {
    id: "jetp",
    name: "JETP / ETM",
    fullName: "Just Energy Transition Partnership / Energy Transition Mechanism",
    category: "Climate",
    status: "Emerging",
    adoptionYear: "2022",
    description:
      "JETPs are bilateral agreements providing concessional finance to developing countries for accelerating coal phase-out and clean energy scale-up. Indonesia's $20B JETP (2022) and the ADB-backed Energy Transition Mechanism (ETM) offer structured coal retirement pathways with blended public-private finance.",
    investmentRelevance:
      "AsiaPower Energy's coal fleet stranded asset risk can be partially mitigated through JETP ETM early retirement deals. These mechanisms provide below-market capital for coal plant closure and renewable replacement — directly relevant to Temasek's ASEAN energy transition thesis.",
    keyRequirements: [
      "Coal plant retirement timelines and social plans",
      "Renewable energy capacity replacement requirements",
      "Just transition safeguards for workers and communities",
    ],
    aseanContext:
      "Indonesia, Vietnam, Philippines, and Thailand all have active or pending JETPs. The ETM is piloting in the Philippines and exploring Indonesia. These create the most significant blended finance opportunity in ASEAN energy.",
    url: "https://www.adb.org/what-we-do/energy-transition-mechanism",
    temasekRelevance: "High",
  },
  {
    id: "ungp",
    name: "UNGPs",
    fullName: "UN Guiding Principles on Business and Human Rights",
    category: "Social",
    status: "Voluntary",
    adoptionYear: "2011",
    description:
      "The UNGPs — the Ruggie Framework — are the authoritative global standard on business and human rights, endorsed by the UN Human Rights Council in 2011. The three-pillar structure covers State duty to protect human rights, corporate responsibility to respect human rights, and access to remedy. The UNGPs underpin the EU Corporate Sustainability Due Diligence Directive (CSDDD) and ILO just transition guidance.",
    investmentRelevance:
      "The UNGP framework is increasingly foundational for 'S' in ESG scoring. For ASEAN portfolio companies with complex supply chains — agriculture, manufacturing, logistics — UNGP alignment determines exposure to forced labour regulation (UK MSCA, EU CSDDD), ESG rating penalties, and investor exclusion risk. Stewardship engagement should include UNGP-aligned due diligence assessments as a standard investment condition.",
    keyRequirements: [
      "Human rights policy commitment at board level",
      "Human rights due diligence (HRDD) process across value chain",
      "Grievance and remedy mechanisms accessible to affected communities",
      "Annual reporting aligned to UNGP Reporting Framework",
    ],
    aseanContext:
      "ASEAN supply chains in agriculture, electronics, and construction face persistent forced labour and migrant worker risks. Singapore's MAS ESG guidelines and SGX sustainability reporting now reference UNGP as the baseline social standard. The EU CSDDD (company compliance from 2029 under the amended Omnibus I timeline) mandates UNGP-aligned HRDD for EU-importing companies, directly affecting GreenHarvest, SeaPort Logistics, and Nusantara Bank's trade finance book.",
    url: "https://www.ohchr.org/en/business-and-human-rights",
    temasekRelevance: "High",
  },
  {
    id: "pcaf",
    name: "PCAF",
    fullName: "Partnership for Carbon Accounting Financials",
    category: "Climate",
    status: "Voluntary",
    adoptionYear: "2020",
    description:
      "PCAF provides a standardised methodology for financial institutions to measure and disclose their financed emissions (Scope 3 Category 15). Covers 8 asset classes including listed equity, corporate bonds, business loans, commercial real estate, mortgages, motor vehicle loans, project finance, and sovereign debt.",
    investmentRelevance:
      "Critical for Nusantara Bank's financed emissions disclosure. Without PCAF, banks cannot credibly report Scope 3 Category 15. PCAF adoption is increasingly expected by institutional investors and regulators as part of net zero alignment.",
    keyRequirements: [
      "Attribution factor methodology for each asset class",
      "Data quality scoring system",
      "Annual financed emissions disclosure",
      "Alignment with GHG Protocol Corporate Value Chain Standard",
    ],
    aseanContext:
      "PCAF has 370+ signatory financial institutions globally but ASEAN adoption remains low. OJK (Indonesia) and MAS are increasingly referencing PCAF in climate risk guidance. Early adopters gain competitive advantage.",
    url: "https://carbonaccountingfinancials.com",
    temasekRelevance: "High",
  },
];

export const caseStudies: CaseStudy[] = [
  {
    id: "asean-coal-retirement",
    title: "Accelerated Coal Retirement via JETP ETM: Philippines Case",
    company: "Illustrative ASEAN Coal IPP (composite)",
    sector: "Electric Utilities",
    region: "Southeast Asia",
    theme: "Climate Transition",
    summary:
      "The ADB-backed Energy Transition Mechanism (ETM) in the Philippines enabled early retirement of a 600MW coal plant by refinancing it with concessional capital and requiring proceeds to fund renewable energy development. The transaction demonstrated that financial structuring can align private investor returns with coal phase-out timelines.",
    outcome:
      "Coal plant retired 7 years ahead of scheduled end-of-life. Proceeds funded 400MW solar + storage pipeline. Reduced 2.4 million tCO₂e annually. First ETM transaction in Southeast Asia.",
    lessonLearned:
      "ESG value creation through coal retirement requires early engagement with multilateral DFIs, a credible just transition plan for workers, and careful structuring of the renewable replacement pipeline to maintain investor returns.",
    frameworks: ["JETP/ETM", "TCFD", "ILO Just Transition", "SBTi"],
    year: "2024",
  },
  {
    id: "palm-oil-eudr",
    title: "EUDR Compliance Transformation: Palm Oil Supply Chain Traceability",
    company: "Illustrative ASEAN Palm Oil Producer (composite)",
    sector: "Agriculture",
    region: "Southeast Asia",
    theme: "Nature & Biodiversity",
    summary:
      "A major Indonesian palm oil producer implemented satellite-linked supply chain traceability covering 100% of its concessions and smallholder suppliers to achieve EUDR compliance, unlock EU premium market access, and demonstrate deforestation-free supply chains to major European FMCG buyers.",
    outcome:
      "Full EUDR compliance achieved across 3.2 million hectares of supply base. EU export revenues protected ($240M annually). Unlocked €50/MT sustainability premium with 4 major European retailers. 8,000 smallholders onboarded to digital traceability platform.",
    lessonLearned:
      "EUDR compliance, while initially a regulatory burden, creates durable competitive advantage. The traceability infrastructure also enables biodiversity monitoring (TNFD) and RSPO verification, generating multiple ESG value streams from one investment.",
    frameworks: ["EUDR", "TNFD LEAP", "RSPO P&C 2018", "SBTN"],
    year: "2025",
  },
  {
    id: "green-cloud-singapore",
    title: "Green Data Centre Certification: From PUE 1.6 to BCA Green Mark Platinum",
    company: "Illustrative Singapore Data Centre Operator (composite)",
    sector: "Technology / Data Centres",
    region: "Singapore",
    theme: "Climate Transition",
    summary:
      "A leading Singapore data centre operator transformed its energy infrastructure to achieve BCA Green Mark Platinum certification, reach 100% renewable energy via I-REC procurement, and improve PUE from 1.6 to 1.35 — unlocking premium ESG-conscious enterprise clients and cheaper green financing.",
    outcome:
      "BCA Green Mark Platinum achieved. 100% RE via I-REC. PUE improved from 1.6 to 1.35, reducing energy costs by 15%. ESG-linked revolving credit facility at 40bps lower rate. Three new MNC enterprise clients explicitly citing green certification as selection criterion.",
    lessonLearned:
      "Singapore's data centre green infrastructure race is creating first-mover advantage. The ESG business case is strong: lower energy costs + premium pricing + better financing + regulatory compliance. The right investment sequencing is PUE first, then RE procurement.",
    frameworks: ["ISSB S2", "GHG Protocol", "BCA Green Mark", "SBTi"],
    year: "2024",
  },
  {
    id: "financed-emissions-bank",
    title: "Financed Emissions Disclosure: PCAF Adoption at an ASEAN Bank",
    company: "Illustrative Indonesian Commercial Bank (composite)",
    sector: "Commercial Banking",
    region: "Southeast Asia",
    theme: "Sustainable Finance",
    summary:
      "An Indonesian commercial bank implemented PCAF methodology for its corporate lending book to disclose Scope 3 Category 15 financed emissions for the first time, enabling identification of high-carbon concentration risk and development of a credible net zero lending commitment.",
    outcome:
      "Full PCAF Scope 3 Cat 15 disclosure for 80% of corporate book. Identified 4 sectors with >70% of financed emissions. Set 2030 sector-level intensity targets for power and steel. Unlocked IFC co-lending partnership conditional on PCAF adoption.",
    lessonLearned:
      "PCAF adoption changes the entire risk lens for a bank's corporate book. High financed emissions concentration in 2–3 sectors creates both credit risk (stranded assets) and commercial opportunity (transition finance products). Start with top 50 clients for maximum insight at manageable data complexity.",
    frameworks: ["PCAF", "GHG Protocol", "TCFD", "ISSB S2", "SBTi"],
    year: "2025",
  },
  {
    id: "nature-biodiversity-agri",
    title: "TNFD LEAP Pilot in Southeast Asian Agriculture",
    company: "Illustrative ASEAN Agribusiness (composite)",
    sector: "Agriculture",
    region: "Southeast Asia",
    theme: "Nature & Biodiversity",
    summary:
      "A leading ASEAN agribusiness completed the first full TNFD LEAP (Locate, Evaluate, Assess, Prepare) assessment across its palm oil and sugar supply chains, quantifying nature dependencies and impacts for the first time and developing nature-positive commitments aligned to the Kunming-Montreal Global Biodiversity Framework.",
    outcome:
      "TNFD LEAP completed for operations in 6 countries. Identified 3 high-priority biomes for biodiversity intervention. Established biodiversity net gain targets for 2 Sabah concessions. Attracted blended finance from a European development bank for HCV area conservation.",
    lessonLearned:
      "TNFD LEAP assessment in complex agricultural supply chains requires satellite mapping, local NGO partnerships, and community consent processes. The initial assessment cost is high, but the resulting nature dependency map is foundational for EUDR compliance, RSPO verification, and biodiversity credit generation.",
    frameworks: ["TNFD LEAP", "GBF 30x30", "SBTN", "EUDR", "RSPO"],
    year: "2025",
  },
  {
    id: "jetp-just-transition",
    title: "JETP Coal Workforce Transition: Indonesia ETM Social Safeguards",
    company: "Illustrative Indonesian State Power Utility (composite)",
    sector: "Electric Utilities",
    region: "Southeast Asia",
    theme: "Just Transition",
    summary:
      "Indonesia's $20B Just Energy Transition Partnership (JETP) required a credible just transition plan for 12,000 coal power workers across East Kalimantan and Sumatra as a condition for accessing ADB-facilitated Energy Transition Mechanism blended finance. The social safeguards design became a model for ASEAN coal phase-out deals.",
    outcome:
      "ILO-aligned just transition framework covering 12,000 direct workers and 40,000+ supply chain dependants. Reskilling programme placed 60% of affected workers in renewable energy construction and O&M roles within 18 months. Social risk downgrade from High to Medium enabled ETM bond issuance at 180bps tighter than unguaranteed sovereign risk. First ASEAN JETP to achieve financial close.",
    lessonLearned:
      "Just transition plans must be developed before, not after, financial close. The credibility of the social safeguard framework — independently audited by ILO and a local NGO coalition — was the single factor that unlocked multilateral co-investment. Investors increasingly treat just transition as a financial risk factor, not a CSR add-on.",
    frameworks: ["ILO Just Transition Guidelines", "JETP/ETM", "ADB Social Protection", "UN SDG 8"],
    year: "2025",
  },
];
