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
        {tab === "engagement" && <EngagementTab co={co} />}
      </div>
    </div>
  );
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
                    <span className="text-amber-400 mt-0.5">◦</span>{c}
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
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
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
  return (
    <div className="grid grid-cols-2 gap-6">
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
                {isWarning ? <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="text-xs text-gray-700">{label}</span>
              </div>
              <div className={`text-xs font-medium mt-1 ${isWarning ? "text-amber-400" : "text-emerald-400"}`}>
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
                    {issue.opportunity && <span className="text-xs text-emerald-400">Opportunity</span>}
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
    </div>
  );
}

function GovStatTile({ label, value, note, status }: { label: string; value: string; note: string; status: "ok" | "warn" | "gap" }) {
  const borderColor = status === "ok" ? "border-emerald-500/20" : status === "gap" ? "border-red-500/20" : "border-amber-500/20";
  const bgColor = status === "ok" ? "bg-emerald-500/5" : status === "gap" ? "bg-red-500/5" : "bg-amber-500/5";
  const valueColor = status === "ok" ? "text-emerald-700" : status === "gap" ? "text-red-700" : "text-amber-700";
  const iconEl = status === "ok"
    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
    : <AlertCircle className={`w-3.5 h-3.5 flex-shrink-0 ${status === "gap" ? "text-red-400" : "text-amber-400"}`} />;
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

function EngagementTab({ co }: { co: Company }) {
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
                <span className="text-red-400 font-medium">Overdue: </span>
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
