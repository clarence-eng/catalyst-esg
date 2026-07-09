"use client";
import { useState, useMemo } from "react";
import { type Company } from "@/data/companies";
import { RiskBadge, RatingBadge, MaturityBadge, ScoreRing } from "@/components/ui-elements";
import { AIOutput } from "@/components/AIOutput";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Loader2, FileText, CheckCircle, AlertCircle, TrendingUp, Shield, Leaf, Users, Copy, GitMerge } from "lucide-react";

const SEVERITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const MEGATREND_COLORS: Record<string, string> = {
  "Climate Transition": "text-emerald-700",
  "Nature & Biodiversity": "text-green-700",
  "Just Transition & Inclusive Growth": "text-orange-600",
  "AI & Digital Ethics": "text-blue-700",
  "Longer Lifespans": "text-indigo-700",
};

const TNFD_PILLAR_DESCS: Record<string, string> = {
  "Governance": "Board oversight of nature-related risks and opportunities",
  "Strategy": "Actual and potential nature-related impacts on business strategy",
  "Risk & Impact Mgmt": "LEAP assessment: Locate, Evaluate, Assess, Prepare",
  "Metrics & Targets": "Nature-related KPIs and targets aligned to GBF",
};

const TABS = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "climate", label: "Climate", icon: Shield },
  { id: "nature", label: "Nature", icon: Leaf },
  { id: "social", label: "Social & Governance", icon: Users },
  { id: "engagement", label: "Engagement", icon: FileText },
] as const;

export function CompanyProfile({ company: co }: { company: Company }) {
  const [tab, setTab] = useState<"overview" | "climate" | "nature" | "social" | "engagement">("overview");
  const [memo, setMemo] = useState("");
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoError, setMemoError] = useState("");
  const [memoGeneratedAt, setMemoGeneratedAt] = useState<Date | null>(null);
  const [questions, setQuestions] = useState("");
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState("");
  const [questionsGeneratedAt, setQuestionsGeneratedAt] = useState<Date | null>(null);

  const radarData = useMemo(() => {
    // Climate Resilience blends transition, physical risk, and pathway alignment
    const transitionPenalty = co.climateRisk.transition === "Critical" ? 100 : co.climateRisk.transition === "High" ? 70 : co.climateRisk.transition === "Medium" ? 40 : 0;
    const physicalPenalty = co.climateRisk.physical === "Critical" ? 100 : co.climateRisk.physical === "High" ? 70 : co.climateRisk.physical === "Medium" ? 40 : 0;
    const pathwayPenalty = co.climateRisk.pathwayAlignment === "3°C+" ? 30 : co.climateRisk.pathwayAlignment === "2°C" ? 15 : co.climateRisk.pathwayAlignment === "Not assessed" ? 20 : 0;
    const climateResScore = Math.max(0, 100 - Math.round((transitionPenalty + physicalPenalty + pathwayPenalty) / 3));
    const climateResLabel = `Climate Resilience (${co.climateRisk.pathwayAlignment})`;
    return [
      { subject: "Environmental", score: co.esgScore.environmental },
      { subject: "Social", score: co.esgScore.social },
      { subject: "Governance", score: co.esgScore.governance },
      { subject: climateResLabel, score: climateResScore },
      { subject: "Nature Resilience", score: Math.max(0, 100 - (co.natureRisk.overall === "Critical" ? 100 : co.natureRisk.overall === "High" ? 70 : co.natureRisk.overall === "Medium" ? 40 : 0)) },
    ];
  }, [co.esgScore.environmental, co.esgScore.social, co.esgScore.governance, co.climateRisk.transition, co.climateRisk.physical, co.climateRisk.pathwayAlignment, co.natureRisk.overall]);

  async function generateMemo() {
    setMemoLoading(true);
    setMemoError("");
    try {
      const topIssues = [...co.materialIssues]
        .filter((i) => !i.opportunity)
        .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))
        .slice(0, 3)
        .map((i) => `${i.issue} (${i.severity})`)
        .join(", ");
      const topUplift = co.valueUplift.slice(0, 2).map((u) => u.area).join(", ");
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "deal_memo",
          context: {
            name: co.name,
            sector: co.sector,
            sasbCategory: co.sasbCategory,
            country: co.country,
            region: co.region,
            rating: co.esgScore.rating,
            overallScore: co.esgScore.overall,
            eScore: co.esgScore.environmental,
            sScore: co.esgScore.social,
            gScore: co.esgScore.governance,
            maturity: co.maturity,
            physicalRisk: co.climateRisk.physical,
            transitionRisk: co.climateRisk.transition,
            transitionContext: co.climateRisk.transitionDetails.slice(0, 2).join("; "),
            pathway: co.climateRisk.pathwayAlignment,
            natureRisk: co.natureRisk.overall,
            topIssues,
            topUplift,
            carbonIntensity: co.carbonIntensity,
            greenRevenuePct: co.greenRevenuePct,
          },
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      let data: { error?: string; text?: string };
      try { data = await res.json(); } catch { throw new Error(`Request failed: ${res.status} (unexpected response format)`); }
      if (data.error) throw new Error(data.error);
      if (!data.text) throw new Error("No content received from AI");
      setMemo(data.text);
      setMemoGeneratedAt(new Date());
    } catch (e: unknown) {
      setMemoError(e instanceof Error ? e.message : "Failed to generate memo");
    } finally {
      setMemoLoading(false);
    }
  }

  async function generateQuestions() {
    setQuestionsLoading(true);
    setQuestionsError("");
    try {
      const topIssues = [...co.materialIssues]
        .filter((i) => !i.opportunity)
        .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))
        .slice(0, 4).map((i) => `${i.issue} (${i.severity}, ${i.category})`).join("; ");
      const overdueEngs = co.engagement.filter(e => e.status === "Overdue").map(e => e.topic).join("; ");
      const regulatoryContext = [
        co.climateRisk.transition !== "Low" && "Climate transition regulatory pressure",
        co.natureRisk.deforestationRisk && "EUDR deforestation compliance",
        co.netZeroCommitment === "None" && "No net zero commitment — ISSB S2 readiness gap",
      ].filter(Boolean).join("; ");
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "engagement_questions",
          context: {
            name: co.name, sector: co.sector, country: co.country, maturity: co.maturity,
            transitionRisk: co.climateRisk.transition, natureRisk: co.natureRisk.overall,
            pathway: co.climateRisk.pathwayAlignment, commitment: co.netZeroCommitment,
            topIssues, overdueEngagements: overdueEngs || "None",
            regulatoryContext: regulatoryContext || "Standard regulatory environment",
          },
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      let data: { error?: string; text?: string };
      try { data = await res.json(); } catch { throw new Error(`Request failed: ${res.status}`); }
      if (data.error) throw new Error(data.error);
      if (!data.text) throw new Error("No content received from AI");
      setQuestions(data.text);
      setQuestionsGeneratedAt(new Date());
    } catch (e: unknown) {
      setQuestionsError(e instanceof Error ? e.message : "Failed to generate questions");
    } finally {
      setQuestionsLoading(false);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{co.name}</h1>
              <RatingBadge rating={co.esgScore.rating} />
              <MaturityBadge level={co.maturity} />
              {co.netZeroCommitment !== "None" && (
                <NetZeroBadge commitment={co.netZeroCommitment} />
              )}
              {co.portfolioStatus === "Pipeline" && (
                <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full font-medium">
                  <GitMerge className="w-3 h-3" /> Under Evaluation
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm max-w-2xl mb-2">{co.description}</p>
            {co.sdgAlignment.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3">
                {co.sdgAlignment.map(({ sdg, label }) => (
                  <SDGBadge key={sdg} sdg={sdg} label={label} />
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{co.sasbCategory}</span>
              <span>·</span>
              <span>{co.country}, {co.region}</span>
              <span>·</span>
              <span>Temasek Megatrend: <span className={MEGATREND_COLORS[co.temasekMegatrend] ?? "text-gray-600"}>{co.temasekMegatrend}</span></span>
              <span>·</span>
              <span>Last updated: {formatDate(co.lastUpdated)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ScoreRing score={co.esgScore.environmental} label="E" size={72} />
            <ScoreRing score={co.esgScore.social} label="S" size={72} />
            <ScoreRing score={co.esgScore.governance} label="G" size={72} />
            <ScoreRing score={co.esgScore.overall} label="Overall" size={80} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 border-b border-gray-200 mb-6"
        role="tablist"
        aria-label="Company ESG sections"
        onKeyDown={(e) => {
          const ids = TABS.map(t => t.id);
          const currentIdx = ids.indexOf(tab);
          let target: string | null = null;
          if (e.key === "ArrowRight") target = ids[(currentIdx + 1) % ids.length];
          else if (e.key === "ArrowLeft") target = ids[(currentIdx - 1 + ids.length) % ids.length];
          else if (e.key === "Home") target = ids[0];
          else if (e.key === "End") target = ids[ids.length - 1];
          if (target) {
            e.preventDefault();
            setTab(target as typeof tab);
            document.getElementById(`tab-${target}`)?.focus();
          }
        }}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`tabpanel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors focus-visible:ring-2 focus-visible:ring-purple-600/50 focus-visible:outline-none rounded-sm ${
              tab === id
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content — all panels rendered, inactive ones hidden so aria-controls always resolves */}
      <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview" hidden={tab !== "overview"}>
        {tab === "overview" && <OverviewTab co={co} radarData={radarData} memo={memo} memoLoading={memoLoading} memoError={memoError} onGenerate={generateMemo} memoGeneratedAt={memoGeneratedAt} />}
      </div>
      <div role="tabpanel" id="tabpanel-climate" aria-labelledby="tab-climate" hidden={tab !== "climate"}>
        {tab === "climate" && <ClimateTab co={co} />}
      </div>
      <div role="tabpanel" id="tabpanel-nature" aria-labelledby="tab-nature" hidden={tab !== "nature"}>
        {tab === "nature" && <NatureTab co={co} />}
      </div>
      <div role="tabpanel" id="tabpanel-social" aria-labelledby="tab-social" hidden={tab !== "social"}>
        {tab === "social" && <SocialTab co={co} />}
      </div>
      <div role="tabpanel" id="tabpanel-engagement" aria-labelledby="tab-engagement" hidden={tab !== "engagement"}>
        {tab === "engagement" && <EngagementTab co={co} onGenerateQuestions={generateQuestions} questions={questions} questionsLoading={questionsLoading} questionsError={questionsError} questionsGeneratedAt={questionsGeneratedAt} />}
      </div>
    </div>
  );
}

type TaxonomyTier = "Tier 1" | "Tier 2" | "Not classified";

function getASEANTaxonomy(co: Company): { activity: string; tier: TaxonomyTier; pct: number }[] {
  const sector = co.sector.toLowerCase();
  if (sector.includes("electric util")) return [
    { activity: "Renewable/Geothermal Generation", tier: "Tier 1", pct: co.greenRevenuePct },
    { activity: "Coal/Gas Generation", tier: "Not classified", pct: 100 - co.greenRevenuePct },
  ].filter(a => a.pct > 0) as { activity: string; tier: TaxonomyTier; pct: number }[];
  if (sector.includes("marine") || sector.includes("transport")) return [
    { activity: `Shipping (transition via ${co.netZeroCommitment !== "None" ? "SBTi pathway" : "IMO CII"})`, tier: "Tier 2", pct: 100 },
  ];
  if (sector.includes("agriculture")) return [
    { activity: "Certified Sustainable Agri (RSPO/EUDR-compliant)", tier: "Tier 1", pct: co.greenRevenuePct },
    { activity: "Conventional Agriculture", tier: "Tier 2", pct: 100 - co.greenRevenuePct },
  ].filter(a => a.pct > 0) as { activity: string; tier: TaxonomyTier; pct: number }[];
  if (sector.includes("bank") || sector.includes("finance")) return [
    { activity: "Green/Transition Finance Products", tier: "Tier 1", pct: co.greenRevenuePct },
    { activity: "General Corporate Lending", tier: "Tier 2", pct: 60 - co.greenRevenuePct > 0 ? 60 - co.greenRevenuePct : 0 },
    { activity: "Carbon-intensive Sector Lending", tier: "Not classified", pct: 40 },
  ].filter(a => a.pct > 0) as { activity: string; tier: TaxonomyTier; pct: number }[];
  if (sector.includes("technology") || sector.includes("digital")) return [
    { activity: "Cloud/Digital Infrastructure", tier: (co.greenRevenuePct > 20 ? "Tier 1" : "Tier 2") as TaxonomyTier, pct: 100 },
  ];
  if (sector.includes("health")) return [
    { activity: "Digital Health Platform", tier: "Tier 2", pct: 100 },
  ];
  return [{ activity: co.sector, tier: "Not classified", pct: 100 }];
}

function ASEANTaxonomyCard({ co }: { co: Company }) {
  const activities = getASEANTaxonomy(co);
  const tier1Pct = activities.filter(a => a.tier === "Tier 1").reduce((s, a) => s + a.pct, 0);
  const tier2Pct = activities.filter(a => a.tier === "Tier 2").reduce((s, a) => s + a.pct, 0);
  const unclassifiedPct = activities.filter(a => a.tier === "Not classified").reduce((s, a) => s + a.pct, 0);

  const tierBadgeClass: Record<TaxonomyTier, string> = {
    "Tier 1": "text-emerald-700 bg-emerald-50 border-emerald-300",
    "Tier 2": "text-amber-700 bg-amber-50 border-amber-300",
    "Not classified": "text-gray-600 bg-gray-100 border-gray-300",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-900">ASEAN Taxonomy Alignment (ATSF v2)</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">Singapore-Asia Taxonomy for Sustainable Finance · 2023</p>

      {/* Stacked bar */}
      <div className="w-full h-3 rounded-full overflow-hidden flex mb-4 bg-gray-100">
        {tier1Pct > 0 && (
          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${tier1Pct}%` }}
            title={`Tier 1 (Green): ${tier1Pct}%`}
          />
        )}
        {tier2Pct > 0 && (
          <div
            className="bg-amber-400 h-full"
            style={{ width: `${tier2Pct}%` }}
            title={`Tier 2 (Transitional): ${tier2Pct}%`}
          />
        )}
        {unclassifiedPct > 0 && (
          <div
            className="bg-gray-300 h-full"
            style={{ width: `${unclassifiedPct}%` }}
            title={`Not classified: ${unclassifiedPct}%`}
          />
        )}
      </div>

      {/* Bar legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {tier1Pct > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            Tier 1 (Green) — {tier1Pct}%
          </div>
        )}
        {tier2Pct > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            Tier 2 (Transitional) — {tier2Pct}%
          </div>
        )}
        {unclassifiedPct > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-2.5 h-2.5 rounded-sm bg-gray-300" />
            Not classified — {unclassifiedPct}%
          </div>
        )}
      </div>

      {/* Activity rows */}
      <div className="space-y-2">
        {activities.map((a, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50 border border-gray-100">
            <span className="text-xs text-gray-700 flex-1 min-w-0 mr-3 truncate">{a.activity}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500">{a.pct}%</span>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${tierBadgeClass[a.tier]}`}>
                {a.tier}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSASBKPIs(co: Company): { kpi: string; value: string; unit: string; benchmark: string; note?: string }[] {
  const cat = co.sasbCategory.toLowerCase();

  if (cat.includes("marine") || cat.includes("shipping")) return [
    { kpi: "Carbon Intensity", value: co.carbonIntensity.toString(), unit: "tCO₂e/$M revenue", benchmark: "Industry median: ~280", note: "IMO CII compliance critical" },
    { kpi: "Fuel Mix (HFO %)", value: `~${100 - co.greenRevenuePct}%`, unit: "of fuel", benchmark: "IMO 2030 target: <50%", note: "Decarbonisation driver" },
    { kpi: "Port Environmental Rating", value: co.natureRisk.overall === "Low" ? "ECA Compliant" : "Needs Review", unit: "", benchmark: "Industry: 70% compliant" },
    { kpi: "Near-miss Safety Incidents", value: "Not disclosed", unit: "per year", benchmark: "ISM Code required", note: co.materialIssues.some(i => i.issue.toLowerCase().includes("safety")) ? "Material issue" : undefined },
  ];

  if (cat.includes("banking") || cat.includes("commercial bank")) return [
    { kpi: "Green & Transition Finance Ratio", value: `${co.greenRevenuePct}%`, unit: "of total lending", benchmark: "Singapore target: 10%+ by 2025" },
    { kpi: "Carbon-Intensive Sector Exposure", value: co.materialIssues.some(i => i.issue.includes("Financed Emissions")) ? "High — disclosed" : "Moderate", unit: "of loan book", benchmark: "PCAF required for Scope 3 Cat. 15" },
    { kpi: "ESG Screening Coverage", value: co.natureRisk.overall === "Low" ? ">80% of new loans" : "Partial (<50%)", unit: "of new origination", benchmark: "MAS best practice: 100%" },
    { kpi: "Financial Inclusion Score", value: co.materialIssues.some(i => i.issue.includes("Inclusion")) ? "Active programmes" : "Not reported", unit: "", benchmark: "OJK mandate for Indonesian banks" },
  ];

  if (cat.includes("agriculture")) return [
    { kpi: "Deforestation-Free Supply Chain", value: co.natureRisk.deforestationRisk ? "Partial (gaps remain)" : "Certified", unit: "", benchmark: "EUDR Dec 2026 deadline", note: "NDPE policy verification critical" },
    { kpi: "Water Intensity", value: co.natureRisk.waterStress ? "High water footprint" : "Within local limits", unit: "m³/$M revenue", benchmark: "TNFD/SBTN watershed threshold" },
    { kpi: "Smallholder Certification", value: `${co.greenRevenuePct}%`, unit: "of supply base certified", benchmark: "RSPO P&C: 100% target" },
    { kpi: "Land Under NDPE Policy", value: co.natureRisk.deforestationRisk ? "Partial coverage" : "Full concession coverage", unit: "", benchmark: "RSPO 2018 P&C required" },
  ];

  if (cat.includes("electric util") || cat.includes("power")) return [
    { kpi: "Carbon Intensity (Generation)", value: `${co.carbonIntensity} tCO₂e/$M`, unit: "revenue", benchmark: "IEA ASEAN 2030: <500 tCO₂e/$M" },
    { kpi: "Renewable Capacity Share", value: `${co.greenRevenuePct}%`, unit: "of total installed", benchmark: "Indonesia NDC: 23% RE by 2025" },
    { kpi: "Just Transition Plan", value: co.materialIssues.some(i => i.issue.includes("Just Transition")) ? "In development" : "Not initiated", unit: "", benchmark: "JETP ETM requirement" },
    { kpi: "Coal Phase-out Target", value: co.netZeroCommitment !== "None" ? "Committed" : "Not committed", unit: "", benchmark: "Indonesia 2040 coal exit target" },
  ];

  if (cat.includes("technology") || cat.includes("software") || cat.includes("health care")) return [
    { kpi: "Data Centre PUE", value: co.carbonIntensity < 50 ? "≤1.40 (efficient)" : "1.40–1.60 (improving)", unit: "", benchmark: "BCA Green Mark: ≤1.35" },
    { kpi: "Renewable Energy %", value: `${co.greenRevenuePct}%`, unit: "of electricity use", benchmark: "Singapore MAS: 100% RE target" },
    { kpi: "Data Privacy Incidents", value: co.materialIssues.some(i => i.issue.toLowerCase().includes("data") || i.issue.toLowerCase().includes("privacy")) ? "Material concern" : "No disclosed breaches", unit: "last 12 months", benchmark: "PDPA/PDPL zero-tolerance" },
    { kpi: "AI Ethics Policy", value: co.boardComposition.esgCommittee ? "Board-approved policy" : "Under development", unit: "", benchmark: "MAS FEAT Principles" },
  ];

  return [
    { kpi: "ESG Score", value: co.esgScore.overall.toString(), unit: "/100", benchmark: "Portfolio median: 59" },
    { kpi: "Carbon Intensity", value: co.carbonIntensity.toString(), unit: "tCO₂e/$M", benchmark: "Portfolio median varies by sector" },
  ];
}

function OverviewTab({
  co, radarData, memo, memoLoading, memoError, onGenerate, memoGeneratedAt,
}: {
  co: Company;
  radarData: { subject: string; score: number }[];
  memo: string;
  memoLoading: boolean;
  memoError: string;
  onGenerate: () => void;
  memoGeneratedAt: Date | null;
}) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left: Material Issues */}
      <div className="col-span-2 space-y-4">
        {co.icRecommendation && (
          <div className={`rounded-xl border p-4 ${
            co.icRecommendation.verdict === "Invest Conditional" 
              ? "border-amber-500/30 bg-amber-500/5" 
              : co.icRecommendation.verdict === "Invest" 
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-red-500/30 bg-red-500/5"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-bold ${co.icRecommendation.verdict === "Invest Conditional" ? "text-amber-700" : co.icRecommendation.verdict === "Invest" ? "text-emerald-700" : "text-red-700"}`}>
                IC Recommendation: {co.icRecommendation.verdict}
              </span>
            </div>
            {co.icRecommendation.conditions.length > 0 && (
              <div className="space-y-1 mb-2">
                {co.icRecommendation.conditions.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="text-amber-600 mt-0.5">◦</span>{c}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 italic">{co.icRecommendation.esgGating}</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Material ESG Issues</h3>
          <div className="space-y-3">
            {co.materialIssues.map((issue) => (
              <div key={issue.issue} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex-shrink-0 mt-0.5">
                  {issue.opportunity ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{issue.issue}</span>
                    <RiskBadge level={issue.severity} />
                    <span className="text-xs text-gray-500">{issue.category}</span>
                    {issue.opportunity && (
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                        Opportunity
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{issue.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Value Uplift */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Value Uplift Opportunities</h3>
          <div className="space-y-3">
            {co.valueUplift.map((v) => (
              <div key={v.area} className="p-3 rounded-lg bg-emerald-600/5 border border-emerald-600/15">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{v.area}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    v.potential === "High" ? "text-emerald-700 bg-emerald-50 border-emerald-300" :
                    v.potential === "Medium" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                    "text-gray-600 bg-gray-100 border-gray-200"
                  }`}>{v.potential} potential</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>


        {/* ASEAN Green Taxonomy */}
        <ASEANTaxonomyCard co={co} />

        {/* ESG Credibility Check */}
        {(() => {
          const greenwashChecks = [
            {
              label: "Net Zero pledge without validated SBTi targets",
              concern: co.netZeroCommitment === "Net Zero Pledged",
              note: co.netZeroCommitment === "Net Zero Pledged" ? "Net Zero Pledged without science-based validation — credibility risk" : null,
            },
            {
              label: "Pathway alignment consistent with commitment level",
              concern: co.climateRisk.pathwayAlignment === "3°C+" && co.netZeroCommitment !== "None",
              note: co.climateRisk.pathwayAlignment === "3°C+" && co.netZeroCommitment !== "None" ? "3°C+ trajectory conflicts with stated commitment" : null,
            },
            {
              label: "ESG maturity consistent with ESG score",
              concern: co.maturity === "Leading" && co.esgScore.overall < 65,
              note: co.maturity === "Leading" && co.esgScore.overall < 65 ? `'Leading' maturity with score ${co.esgScore.overall} may overstate progress` : null,
            },
            {
              label: "No overdue Critical engagements",
              concern: co.engagement.filter(e => e.status === "Overdue").length > 0 && co.materialIssues.some(i => i.severity === "Critical"),
              note: co.engagement.filter(e => e.status === "Overdue").length > 0 && co.materialIssues.some(i => i.severity === "Critical") ? "Critical ESG issues present with overdue engagement commitments" : null,
            },
            {
              label: "TNFD assessment consistent with nature risk level",
              concern: co.natureRisk.overall === "Critical" && !co.natureRisk.tnfdAligned && !co.natureRisk.tnfdPillars?.some(p => p.status !== "Gap"),
              note: co.natureRisk.overall === "Critical" ? "Critical nature risk without TNFD assessment initiated" : null,
            },
            {
              label: "Green revenue credibly defined",
              concern: co.greenRevenuePct > 30 && co.netZeroCommitment === "None",
              note: co.greenRevenuePct > 30 && co.netZeroCommitment === "None" ? "High green revenue claim without emissions commitment may lack credibility" : null,
            },
          ];
          const concernCount = greenwashChecks.filter(c => c.concern).length;
          const credibilityScore = greenwashChecks.length - concernCount;
          const scoreColor =
            concernCount === 0 ? "text-emerald-700 bg-emerald-50 border-emerald-300" :
            concernCount <= 2 ? "text-amber-700 bg-amber-50 border-amber-200" :
            "text-red-700 bg-red-50 border-red-200";
          return (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-900">ESG Credibility Check</h3>
                <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${scoreColor}`}>
                  {credibilityScore}/{greenwashChecks.length} checks passed
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Automated flags based on internal data consistency</p>
              <div className="space-y-2">
                {greenwashChecks.map((check, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${check.concern ? "bg-red-50 border border-red-100" : "bg-gray-50 border border-gray-100"}`}>
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${check.concern ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                      {check.concern ? "✗" : "✓"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium ${check.concern ? "text-red-800" : "text-gray-700"}`}>{check.label}</span>
                      {check.concern && check.note && (
                        <p className="text-xs text-red-600 mt-0.5">{check.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* SASB Material KPIs */}
        {(() => {
          const sasbKPIs = getSASBKPIs(co);
          return (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">SASB Material KPIs — {co.sasbCategory}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Most financially material ESG metrics for this industry</p>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left font-medium text-gray-500 pb-2 pr-3">KPI</th>
                    <th className="text-left font-medium text-gray-500 pb-2 pr-3">Value</th>
                    <th className="text-left font-medium text-gray-500 pb-2 pr-3">Benchmark</th>
                    <th className="text-left font-medium text-gray-500 pb-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {sasbKPIs.map((row, i) => (
                    <tr key={row.kpi} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="py-2 pr-3 font-medium text-gray-700 whitespace-nowrap">{row.kpi}</td>
                      <td className="py-2 pr-3 text-gray-900 font-medium">
                        {row.value}{row.unit ? <span className="text-gray-500 font-normal ml-1">{row.unit}</span> : null}
                      </td>
                      <td className="py-2 pr-3 text-gray-500">{row.benchmark}</td>
                      <td className="py-2 text-gray-500 italic">{row.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Deal Memo Generator */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">IC Memo ESG Section</h3>
              <p className="text-xs text-gray-500 mt-0.5">Generate a Temasek-style investment committee ESG assessment.</p>
            </div>
            <button
              onClick={onGenerate}
              disabled={memoLoading}
              aria-busy={memoLoading}
              className="flex items-center gap-2 text-sm bg-[#4B2580] hover:bg-[#3D1A6E] disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {memoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {memoLoading ? "Generating..." : memo ? "Regenerate" : "Generate Assessment"}
            </button>
          </div>
          {memoError && (
            <div role="alert" className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
              {memoError}
            </div>
          )}
          {memo ? (
            <>
              {memoLoading && <div className="text-xs text-gray-500 text-center py-2 mb-2">Regenerating…</div>}
              <AIOutput text={memo} />
              <div className="mt-3 flex items-center">
                <button
                  onClick={() => navigator.clipboard?.writeText(memo).catch(() => {})}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy to clipboard
                </button>
                <span className="text-xs text-gray-500 ml-auto">
                  {memoGeneratedAt ? `Generated ${formatRelativeTime(memoGeneratedAt)}` : ""}
                </span>
              </div>
            </>
          ) : memoLoading ? (
            <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg animate-pulse">
              Generating assessment…
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg">
              <div>Generate a Temasek-style investment committee ESG assessment using AI</div>
              <div className="text-gray-500 mt-1">Requires GEMINI_API_KEY in .env.local</div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Charts & Quick Stats */}
      <div className="space-y-4">
        {/* ESG Radar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">ESG Profile Radar</h3>
          <div role="img" aria-label={`ESG profile radar for ${co.name}: Environmental ${co.esgScore.environmental}, Social ${co.esgScore.social}, Governance ${co.esgScore.governance}, Climate Resilience ${radarData[3]?.score ?? 0} (${co.climateRisk.pathwayAlignment}), Nature Resilience ${radarData[4]?.score ?? 0}`}>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(0,0,0,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10 }} />
              <Radar name="ESG" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Score Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Score Trend (E/S/G)</h3>
          <div role="img" aria-label={`Historical E/S/G score trend for ${co.name}`}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={co.historicalScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="period" tick={{ fill: "#64748b", fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} width={25} />
              <Tooltip
                contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", fontSize: 11 }}
                labelStyle={{ color: "#6b7280" }}
              />
              <Line type="monotone" dataKey="e" stroke="#10b981" strokeWidth={2} dot={{ r: 2, fill: "#10b981", strokeWidth: 0 }} name="E" />
              <Line type="monotone" dataKey="s" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2, fill: "#3b82f6", strokeWidth: 0 }} name="S" />
              <Line type="monotone" dataKey="g" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2, fill: "#8b5cf6", strokeWidth: 0 }} name="G" />
            </LineChart>
          </ResponsiveContainer>
          </div>
          <div className="flex gap-3 mt-2 justify-center">
            {[{ color: "#10b981", label: "E" }, { color: "#3b82f6", label: "S" }, { color: "#8b5cf6", label: "G" }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 rounded" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Metrics</h3>
          <div className="space-y-3">
            <Metric label="Carbon Intensity" value={`${co.carbonIntensity} tCO₂e/$M`} />
            <Metric label="Green Revenue" value={`${co.greenRevenuePct}%`} />
            <Metric label="Pathway Alignment" value={co.climateRisk.pathwayAlignment} />
            <Metric label="TNFD Aligned" value={co.natureRisk.tnfdAligned ? "Yes" : "Not yet"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ClimateTab({ co }: { co: Company }) {
  const tcfdPillars = [
    {
      pillar: "Governance",
      desc: "Board oversight of climate risks and opportunities",
      status: co.boardComposition.esgCommittee ? "Adopted" as const :
              co.boardComposition.ceoChairSplit ? "Partial" as const : "Gap" as const,
    },
    {
      pillar: "Strategy",
      desc: "Climate-related risks/opportunities, scenario analysis, financial planning",
      status: co.climateRisk.transitionDetails.length >= 3 ? "Adopted" as const :
              co.climateRisk.transitionDetails.length >= 1 ? "Partial" as const : "Gap" as const,
    },
    {
      pillar: "Risk Management",
      desc: "Process for identifying, assessing, and managing climate risks",
      status: co.climateRisk.physicalDetails.length > 0 && co.climateRisk.transitionDetails.length > 0 ? "Adopted" as const :
              co.climateRisk.physicalDetails.length > 0 || co.climateRisk.transitionDetails.length > 0 ? "Partial" as const : "Gap" as const,
    },
    {
      pillar: "Metrics & Targets",
      desc: "Metrics and targets to assess and manage climate risks",
      status: co.netZeroCommitment !== "None" && co.carbonIntensity > 0 ? "Adopted" as const :
              co.carbonIntensity > 0 ? "Partial" as const : "Gap" as const,
    },
  ];

  const issbChecks = [
    { item: "Board climate oversight documented", status: co.boardComposition.esgCommittee ? "✓" : "✗", pass: co.boardComposition.esgCommittee },
    { item: "Climate scenario analysis (≥2 scenarios)", status: co.climateRisk.transitionDetails.length >= 2 ? "✓" : "Partial", pass: co.climateRisk.transitionDetails.length >= 2 },
    { item: "Physical risk quantification", status: co.climateRisk.physicalDetails.length > 0 ? "✓" : "✗", pass: co.climateRisk.physicalDetails.length > 0 },
    { item: "Scope 1+2 emissions disclosed", status: co.carbonIntensity > 0 ? "✓" : "✗", pass: co.carbonIntensity > 0 },
    { item: "Scope 3 assessment / financed emissions", status: co.materialIssues.some(i => i.issue.toLowerCase().includes("emission")) ? "Partial" : "✗", pass: false },
    { item: "Climate-related targets set", status: co.netZeroCommitment !== "None" ? "✓" : "✗", pass: co.netZeroCommitment !== "None" },
    { item: "SBTi-validated or equivalent pathway", status: co.netZeroCommitment === "SBTi Targets Set" ? "✓" : co.netZeroCommitment === "SBTi Committed" ? "In Progress" : "✗", pass: co.netZeroCommitment === "SBTi Targets Set" },
  ];
  const issbScore = issbChecks.filter(c => c.pass).length;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Physical Climate Risk</h3>
          <RiskBadge level={co.climateRisk.physical} />
        </div>
        <ul className="space-y-3">
          {co.climateRisk.physicalDetails.map((d, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
              {d}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Transition Risk</h3>
          <RiskBadge level={co.climateRisk.transition} />
        </div>
        <ul className="space-y-3">
          {co.climateRisk.transitionDetails.map((d, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
              {d}
            </li>
          ))}
        </ul>
      </div>
      {/* TCFD Framework Disclosure */}
      <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">TCFD Framework Disclosure</h3>
        <div className="space-y-3">
          {tcfdPillars.map(({ pillar, desc, status }) => {
            const statusStyle = status === "Adopted"
              ? "text-emerald-700 bg-emerald-50 border-emerald-300"
              : status === "Partial"
              ? "text-amber-700 bg-amber-50 border-amber-300"
              : "text-gray-500 bg-gray-100 border-gray-200";
            const dotColor = status === "Adopted" ? "bg-emerald-500" : status === "Partial" ? "bg-amber-500" : "bg-slate-600";
            return (
              <div key={pillar} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                <div>
                  <div className="text-sm font-medium text-gray-900">{pillar}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded border flex-shrink-0 ${statusStyle}`}>{status}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* ISSB S2 Disclosure Readiness */}
      <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">ISSB S2 Disclosure Readiness</h3>
          <span className={`text-xs px-2.5 py-1 rounded border font-medium ${
            issbScore >= 6 ? "text-emerald-700 bg-emerald-50 border-emerald-300" :
            issbScore >= 4 ? "text-amber-700 bg-amber-50 border-amber-300" :
            "text-red-700 bg-red-50 border-red-300"
          }`}>{issbScore}/{issbChecks.length} requirements met</span>
        </div>
        <div className="space-y-2">
          {issbChecks.map(({ item, status, pass }) => {
            const isPartial = status === "Partial" || status === "In Progress";
            const iconColor = pass ? "text-emerald-600" : isPartial ? "text-amber-500" : "text-red-400";
            const rowBg = pass ? "bg-emerald-50 border-emerald-200" : isPartial ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200";
            return (
              <div key={item} className={`flex items-center gap-3 p-2.5 rounded-lg border ${rowBg}`}>
                <span className={`text-sm font-bold w-5 text-center flex-shrink-0 ${iconColor}`}>{status}</span>
                <span className="text-xs text-gray-700">{item}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Paris Pathway Alignment</h3>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-lg text-sm font-bold border ${
            co.climateRisk.pathwayAlignment === "1.5°C" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
            co.climateRisk.pathwayAlignment === "2°C" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
            co.climateRisk.pathwayAlignment === "3°C+" ? "text-red-400 bg-red-500/10 border-red-500/20" :
            "text-gray-600 bg-gray-100 border-gray-200"
          }`}>
            {co.climateRisk.pathwayAlignment}
          </div>
          <p className="text-sm text-gray-600">
            {co.climateRisk.pathwayAlignment === "1.5°C" && "Company has committed to a 1.5°C-aligned emissions pathway (net zero pledge or validated SBTi targets). For financial institutions, this reflects financed emissions trajectory."}
            {co.climateRisk.pathwayAlignment === "2°C" && "Company's trajectory is consistent with a 2°C scenario. Gaps remain to achieve Paris 1.5°C alignment — further decarbonisation required."}
            {co.climateRisk.pathwayAlignment === "3°C+" && "Company's current strategy is not Paris-aligned. Significant transition risk and stranded asset exposure."}
            {co.climateRisk.pathwayAlignment === "Not assessed" && "Climate pathway alignment has not been formally assessed. TCFD scenario analysis recommended."}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {["1.5°C", "2°C", "3°C+"].map((scenario) => (
            <div key={scenario} className={`p-3 rounded-lg border text-center ${
              co.climateRisk.pathwayAlignment === scenario
                ? scenario === "1.5°C" ? "bg-emerald-500/10 border-emerald-500/20" :
                  scenario === "2°C" ? "bg-amber-500/10 border-amber-500/20" :
                  "bg-red-500/10 border-red-500/20"
                : "bg-gray-50 border-gray-200 opacity-40"
            }`}>
              <div className="text-sm font-semibold text-gray-900 mb-1">{scenario} Scenario</div>
              <div className="text-xs text-gray-500">
                {scenario === "1.5°C" && "Paris-aligned, net zero by 2050"}
                {scenario === "2°C" && "Below 2°C, IPCC-compliant"}
                {scenario === "3°C+" && "BAU trajectory, high physical risk"}
              </div>
            </div>
          ))}
          {co.climateRisk.pathwayAlignment === "Not assessed" && (
            <div className="col-span-3 p-3 rounded-lg border text-center bg-gray-50 border-gray-200">
              <div className="text-sm font-semibold text-gray-900 mb-1">Not Assessed</div>
              <div className="text-xs text-gray-500">TCFD scenario analysis not yet conducted</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NatureTab({ co }: { co: Company }) {
  const leapStage =
    co.natureRisk.tnfdAligned ? 4 :
    co.natureRisk.tnfdPillars?.some(p => p.pillar === "Metrics & Targets" && (p.status === "Partial" || p.status === "Adopted")) ? 3 :
    co.natureRisk.tnfdPillars?.some(p => p.pillar === "Strategy" && (p.status === "Partial" || p.status === "Adopted")) ? 2 :
    (co.natureRisk.biodiversityExposure || co.natureRisk.waterStress || co.natureRisk.deforestationRisk) ? 1 : 0;

  const leapPhases = [
    { phase: "L", name: "Locate", desc: "Identify interfaces with nature" },
    { phase: "E", name: "Evaluate", desc: "Understand dependencies & impacts" },
    { phase: "A", name: "Assess", desc: "Assess material nature-related risks" },
    { phase: "P", name: "Prepare", desc: "Prepare to respond and report" },
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* TNFD LEAP Assessment Progress */}
      <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">TNFD LEAP Assessment Progress</h3>
        <div className="flex items-start gap-0">
          {leapPhases.map(({ phase, name, desc }, index) => {
            const completed = leapStage > index;
            const current = leapStage === index;
            const circleStyle = completed
              ? "bg-emerald-600 text-white border-emerald-600"
              : current
              ? "bg-amber-600 text-white border-amber-600"
              : "bg-gray-200 text-gray-400 border-gray-200";
            const labelColor = completed ? "text-emerald-700" : current ? "text-amber-700" : "text-gray-400";
            const lineColor = completed ? "bg-emerald-600" : "bg-gray-200";
            return (
              <div key={phase} className="flex items-start flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${circleStyle}`}>
                    {phase}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-semibold ${labelColor}`}>{name}</div>
                    <div className="text-xs text-gray-400 mt-0.5 max-w-[90px] leading-relaxed">{desc}</div>
                  </div>
                </div>
                {index < leapPhases.length - 1 && (
                  <div className={`h-0.5 flex-1 mt-4 ${lineColor}`} />
                )}
              </div>
            );
          })}
        </div>
        {leapStage === 4 && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-4">
            All LEAP phases complete — company is TNFD-aligned and ready to report.
          </p>
        )}
        {leapStage === 0 && (
          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mt-4">
            LEAP assessment not yet initiated. Begin by identifying interfaces with nature across the value chain.
          </p>
        )}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Nature Risk Overview</h3>
          <RiskBadge level={co.natureRisk.overall} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Biodiversity Exposure", val: co.natureRisk.biodiversityExposure, isRisk: true },
            { label: "Water Stress", val: co.natureRisk.waterStress, isRisk: true },
            { label: "Deforestation Risk", val: co.natureRisk.deforestationRisk, isRisk: true },
            { label: "TNFD Aligned", val: co.natureRisk.tnfdAligned, isRisk: false },
          ].map(({ label, val, isRisk }) => {
            const isWarning = isRisk ? val : !val;
            return (
            <div key={label} className={`p-3 rounded-lg border ${isWarning ? "bg-amber-500/10 border-amber-500/20" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center gap-2">
                {isWarning ? <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="text-xs text-gray-700">{label}</span>
              </div>
              <div className={`text-xs font-medium mt-1 ${isWarning ? "text-amber-700 font-semibold" : "text-emerald-700 font-semibold"}`}>
                {val ? "Yes" : "No"}
              </div>
            </div>
            );
          })}
        </div>
        <ul className="space-y-3">
          {co.natureRisk.details.map((d, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
              {d}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">TNFD Framework</h3>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          The Taskforce on Nature-related Financial Disclosures (TNFD) provides a risk management and disclosure framework for nature-related dependencies, impacts, risks, and opportunities. Final recommendations published September 2023.
        </p>
        <div className="space-y-3">
          {(co.natureRisk.tnfdPillars != null && co.natureRisk.tnfdPillars.length > 0 ? co.natureRisk.tnfdPillars : [
            { pillar: "Governance", status: co.natureRisk.tnfdAligned ? "Adopted" : "Gap" as const },
            { pillar: "Strategy", status: co.natureRisk.tnfdAligned ? "Adopted" : "Gap" as const },
            { pillar: "Risk & Impact Mgmt", status: co.natureRisk.tnfdAligned ? "Adopted" : "Gap" as const },
            { pillar: "Metrics & Targets", status: co.natureRisk.tnfdAligned ? "Adopted" : "Gap" as const },
          ]).map(({ pillar, status }) => {
            const statusStyle = status === "Adopted"
              ? "text-emerald-700 bg-emerald-50 border-emerald-300"
              : status === "Partial"
              ? "text-amber-700 bg-amber-50 border-amber-300"
              : "text-gray-500 bg-gray-100 border-gray-200";
            const dotColor = status === "Adopted" ? "bg-emerald-500" : status === "Partial" ? "bg-amber-500" : "bg-slate-600";
            return (
              <div key={pillar} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                <div>
                  <div className="text-sm font-medium text-gray-900">{pillar}</div>
                  <div className="text-xs text-gray-500">{TNFD_PILLAR_DESCS[pillar] ?? ""}</div>
                </div>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded border flex-shrink-0 ${statusStyle}`}>{status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SocialTab({ co }: { co: Company }) {
  const social = co.materialIssues.filter((i) => i.category === "Social");
  const gov = co.materialIssues.filter((i) => i.category === "Governance");
  const bc = co.boardComposition;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Social Issues</h3>
          {social.length === 0 ? (
            <p className="text-xs text-gray-500">No material social issues identified</p>
          ) : (
            <div className="space-y-3">
              {social.map((issue) => (
                <div key={issue.issue} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{issue.issue}</span>
                    <RiskBadge level={issue.severity} />
                    {issue.opportunity && <span className="text-xs text-emerald-700">Opportunity</span>}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{issue.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Governance Issues</h3>
          {gov.length === 0 ? (
            <p className="text-xs text-gray-500">No material governance issues identified</p>
          ) : (
            <div className="space-y-3">
              {gov.map((issue) => (
                <div key={issue.issue} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{issue.issue}</span>
                    <RiskBadge level={issue.severity} />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{issue.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Governance Scorecard */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Governance Scorecard</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <GovStatTile
            label="Board Size"
            value={`${bc.boardSize} directors`}
            note={bc.boardSize >= 7 && bc.boardSize <= 12 ? "Within optimal range" : bc.boardSize < 7 ? "Below optimal range (7-12)" : "Above optimal range (7-12)"}
            status={bc.boardSize >= 7 && bc.boardSize <= 12 ? "ok" : "warn"}
          />
          <GovStatTile
            label="Independent Directors"
            value={`${bc.independentPct}%`}
            note={bc.independentPct >= 50 ? "Meets best practice (50%+ independent)" : `${bc.independentPct}% — below 50% best practice threshold`}
            status={bc.independentPct >= 50 ? "ok" : "warn"}
          />
          <GovStatTile
            label="Women on Board"
            value={`${bc.womenPct}%`}
            note={bc.womenPct >= 33 ? "Meets 33% gender diversity target (MSCI/EU standard)" : `${bc.womenPct}% — below 33% target`}
            status={bc.womenPct >= 33 ? "ok" : "warn"}
          />
          <GovStatTile
            label="CEO/Chair Split"
            value={bc.ceoChairSplit ? "Separated" : "Combined"}
            note={bc.ceoChairSplit ? "Good governance practice" : "Combined role — concentration risk"}
            status={bc.ceoChairSplit ? "ok" : "warn"}
          />
          <GovStatTile
            label="Audit Committee"
            value={bc.auditCommittee ? "Established" : "None"}
            note={bc.auditCommittee ? "Meets regulatory requirement" : "Gap — required for listed entities"}
            status={bc.auditCommittee ? "ok" : "gap"}
          />
          <GovStatTile
            label="ESG Committee"
            value={bc.esgCommittee ? "Established" : "None"}
            note={bc.esgCommittee ? "Board-level ESG oversight in place" : "No ESG Committee — gap for a company of this risk profile"}
            status={bc.esgCommittee ? "ok" : "warn"}
          />
        </div>
      </div>

      {/* Just Transition Readiness */}
      {(() => {
        const showJustTransition =
          (co.climateRisk.transition === "Critical" || co.climateRisk.transition === "High") &&
          (co.sector.toLowerCase().includes("electric") || co.sector.toLowerCase().includes("energy") ||
            co.sector.toLowerCase().includes("marine"));

        if (!showJustTransition) return null;

        const jtChecks = [
          { item: "Workforce transition plan documented", pass: co.materialIssues.some(i => i.issue.includes("Just Transition") || i.issue.includes("workforce")), note: "ILO Just Transition Guidelines" },
          { item: "Community impact assessment completed", pass: co.materialIssues.some(i => i.category === "Social" && i.issue.includes("Communit")), note: "UNGP community consultation" },
          { item: "Reskilling/retraining programmes funded", pass: co.engagement.some(e => e.topic.toLowerCase().includes("transition") || e.topic.toLowerCase().includes("just")), note: "JETP social safeguards requirement" },
          { item: "Social plan covers downstream supply chain", pass: co.engagement.length > 3, note: "IFC Performance Standards" },
          { item: "Just transition disclosure in annual report", pass: co.netZeroCommitment !== "None", note: "Transition Finance framework" },
        ];

        const passCount = jtChecks.filter(c => c.pass).length;

        return (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-gray-900">Just Transition Readiness</h3>
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${
                passCount >= 4 ? "text-emerald-700 bg-emerald-50 border-emerald-300" :
                passCount >= 2 ? "text-amber-700 bg-amber-50 border-amber-200" :
                "text-red-700 bg-red-50 border-red-200"
              }`}>
                {passCount}/{jtChecks.length} criteria met
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">High-carbon sector — just transition safeguards assessed against ILO, JETP, and IFC standards</p>
            <div className="space-y-2">
              {jtChecks.map((check, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${check.pass ? "bg-gray-50 border border-gray-100" : "bg-red-50 border border-red-100"}`}>
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${check.pass ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                    {check.pass ? "✓" : "✗"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-medium ${check.pass ? "text-gray-700" : "text-red-800"}`}>{check.item}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{check.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function GovStatTile({ label, value, note, status }: { label: string; value: string; note: string; status: "ok" | "warn" | "gap" }) {
  const borderColor = status === "ok" ? "border-emerald-500/20" : status === "gap" ? "border-red-500/20" : "border-amber-500/20";
  const bgColor = status === "ok" ? "bg-emerald-500/5" : status === "gap" ? "bg-red-500/5" : "bg-amber-500/5";
  const valueColor = status === "ok" ? "text-emerald-700" : status === "gap" ? "text-red-700" : "text-amber-700";
  const iconEl = status === "ok"
    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
    : <AlertCircle className={`w-3.5 h-3.5 flex-shrink-0 ${status === "gap" ? "text-red-700" : "text-amber-700"}`} />;
  return (
    <div className={`p-3 rounded-lg border ${borderColor} ${bgColor}`}>
      <div className="flex items-start gap-2 mb-1">
        {iconEl}
        <span className="text-xs text-gray-600 font-medium">{label}</span>
      </div>
      <div className={`text-sm font-bold ${valueColor} mb-1`}>{value}</div>
      <div className="text-xs text-gray-500 leading-relaxed">{note}</div>
    </div>
  );
}

function EngagementTab({ co, onGenerateQuestions, questions, questionsLoading, questionsError, questionsGeneratedAt }: {
  co: Company;
  onGenerateQuestions: () => void;
  questions: string;
  questionsLoading: boolean;
  questionsError: string;
  questionsGeneratedAt: Date | null;
}) {
  const total = co.engagement.length;
  const completed = co.engagement.filter((e) => e.status === "Completed").length;
  const overdue = co.engagement.filter((e) => e.status === "Overdue").length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Show most recent overdue (if any) or earliest planned
  const overdueItems = co.engagement
    .filter((e) => e.status === "Overdue")
    .sort((a, b) => a.date > b.date ? -1 : a.date < b.date ? 1 : 0); // newest overdue first
  const plannedItems = co.engagement
    .filter((e) => e.status === "Planned")
    .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0); // earliest planned first
  const nextDue = overdueItems[0] ?? plannedItems[0] ?? null;

  const stewardshipStatus: "Not Started" | "On Track" | "Attention Needed" | "Action Required" =
    total === 0 || (completed === 0 && overdue === 0) ? "Not Started"
    : overdue === 0 ? "On Track"
    : overdue >= 2 || completed === 0 ? "Action Required"
    : "Attention Needed";

  const statusStyle = {
    "Not Started": "text-gray-600 bg-gray-100 border-gray-300",
    "On Track": "text-emerald-700 bg-emerald-50 border-emerald-300",
    "Attention Needed": "text-amber-700 bg-amber-50 border-amber-300",
    "Action Required": "text-red-700 bg-red-50 border-red-300",
  }[stewardshipStatus];

  return (
    <div className="space-y-4">
      {/* Engagement Summary Row */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-600 font-medium">Completion Rate</span>
              <span className="text-xs text-gray-700 font-semibold">{completed}/{total} ({completionPct}%)</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${completionPct === 0 ? "bg-slate-600" : completionPct >= 75 ? "bg-emerald-500" : completionPct >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${completionPct === 0 ? 0 : completionPct}%` }}
              />
            </div>
          </div>
          {nextDue && (
            <div className="text-xs text-gray-500">
              {nextDue.status === "Overdue" ? (
                <span className="text-red-700 font-medium">Overdue: </span>
              ) : (
                <span>Next planned: </span>
              )}
              <span className="text-gray-700 font-medium">{formatDate(nextDue.date)}</span>
              <span className="ml-1 text-gray-500">({nextDue.topic})</span>
            </div>
          )}
          <span className={`text-xs px-2.5 py-1 rounded border font-medium ${statusStyle}`}>
            {stewardshipStatus}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Engagement Log</h3>
        {co.engagement.length === 0 ? (
          <p className="text-xs text-gray-500">No engagement records yet.</p>
        ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
          <div className="space-y-4">
            {[...co.engagement].sort((a, b) => a.date > b.date ? -1 : a.date < b.date ? 1 : 0).map((e) => (
              <div key={`${e.date}-${e.type}-${e.topic}`} className="relative pl-10">
                <div className={`absolute left-4 top-1.5 w-2 h-2 rounded-full -translate-x-1/2 ${
                  e.status === "Completed" ? "bg-emerald-500" :
                  e.status === "Planned" ? "bg-blue-500" : "bg-red-500"
                }`} />
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{e.topic}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{e.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{formatDate(e.date)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        e.status === "Completed" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                        e.status === "Planned" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                        "text-red-400 bg-red-500/10 border-red-500/20"
                      }`}>{e.status}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{e.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Pre-Engagement Question Pack — AI Feature #5 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Pre-Engagement Question Pack</h3>
            <p className="text-xs text-gray-500 mt-0.5">AI-generated due diligence questions tailored to this company's ESG profile</p>
          </div>
          <button
            onClick={onGenerateQuestions}
            disabled={questionsLoading}
            aria-busy={questionsLoading}
            className="flex items-center gap-2 text-sm bg-[#4B2580] hover:bg-[#3D1A6E] disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            {questionsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {questionsLoading ? "Generating..." : questions ? "Regenerate" : "Generate Questions"}
          </button>
        </div>
        {questionsError && (
          <div role="alert" className="text-xs text-red-700 bg-red-50 border border-red-300 rounded-lg p-3 mb-3">
            {questionsError}
          </div>
        )}
        {questions ? (
          <>
            {questionsLoading && <div className="text-xs text-gray-500 text-center py-2 mb-2">Regenerating…</div>}
            <AIOutput text={questions} />
            <div className="mt-3 flex items-center">
              <button
                onClick={() => navigator.clipboard?.writeText(questions).catch(() => {})}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Copy className="w-3 h-3" />
                Copy question pack
              </button>
              <span className="text-xs text-gray-400 ml-auto">
                {questionsGeneratedAt ? `Generated ${formatRelativeTime(questionsGeneratedAt)}` : ""}
              </span>
            </div>
          </>
        ) : questionsLoading ? (
          <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg animate-pulse">
            Generating engagement questions…
          </div>
        ) : (
          <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg">
            <div>Generate 12 targeted ESG due diligence questions for this company</div>
            <div className="text-gray-400 mt-1">Requires GEMINI_API_KEY in .env.local</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-900 font-medium">{value}</span>
    </div>
  );
}

function SDGBadge({ sdg, label }: { sdg: number; label: string }) {
  const sdgColors: Record<number, string> = {
    2: "bg-[#DDA63A]",
    3: "bg-[#4C9F38]",
    7: "bg-[#FCC30B]",
    8: "bg-[#A21942]",
    9: "bg-[#FD6925]",
    10: "bg-[#DD1367]",
    13: "bg-[#3F7E44]",
    14: "bg-[#0A97D9]",
    15: "bg-[#56C02B]",
  };
  const bg = sdgColors[sdg] ?? "bg-slate-600";
  return (
    <div className={`flex items-center gap-1 ${bg} rounded px-1.5 py-0.5`} title={`SDG ${sdg}: ${label}`}>
      <span className="text-white text-[10px] font-bold leading-none">{sdg}</span>
      <span className="text-white text-[9px] leading-none opacity-90 hidden sm:inline">{label}</span>
    </div>
  );
}

function NetZeroBadge({ commitment }: { commitment: "SBTi Committed" | "SBTi Targets Set" | "Net Zero Pledged" }) {
  const styles: Record<string, string> = {
    "SBTi Committed": "text-emerald-700 bg-emerald-50 border-emerald-300",
    "SBTi Targets Set": "text-blue-700 bg-blue-50 border-blue-300",
    "Net Zero Pledged": "text-teal-700 bg-teal-50 border-teal-300",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${styles[commitment]}`}>
      {commitment}
    </span>
  );
}
