"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCompanies } from "@/lib/useCompanies";
import type { Company } from "@/data/companies";
import { megatrends } from "@/data/megatrends";
import { RatingBadge, MaturityBadge, PageHeader, StatCard } from "@/components/ui-elements";
import { PortfolioBrief } from "@/components/PortfolioBrief";
import { AlertPanel } from "@/components/AlertPanel";
import { RiskHeatmap } from "@/components/RiskHeatmap";
import { ArrowRight, GitMerge } from "lucide-react";

// Lazy-load recharts-heavy chart components — deferred until after initial paint
const PortfolioTrend = dynamic(() => import("@/components/PortfolioTrend").then(m => ({ default: m.PortfolioTrend })), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="h-8 w-full bg-gray-100 rounded animate-pulse mb-2" />
      <div className="h-[140px] w-full bg-gray-100 rounded animate-pulse" />
    </div>
  ),
});
const PortfolioBubbleChart = dynamic(() => import("@/components/PortfolioBubbleChart").then(m => ({ default: m.PortfolioBubbleChart })), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-3 w-12 bg-gray-100 rounded animate-pulse" />)}
        </div>
      </div>
      <div className="h-60 w-full bg-gray-100 rounded animate-pulse" />
    </div>
  ),
});

const SEVERITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const overviewColorMap: Record<string, string> = {
  emerald: "border-emerald-600/20 bg-emerald-600/5",
  green: "border-green-600/20 bg-green-600/5",
  orange: "border-orange-500/20 bg-orange-500/5",
  blue: "border-blue-500/20 bg-blue-500/5",
  purple: "border-purple-500/20 bg-purple-500/5",
};
const overviewUrgencyMap: Record<string, string> = {
  Immediate: "text-red-700 bg-red-100",
  "Near-term": "text-amber-700 bg-amber-100",
  "Long-term": "text-blue-700 bg-blue-100",
};

export default function OverviewPage() {
  const { companies, showDemoBanner } = useCompanies();
  const activeCompanies = companies.filter((c) => c.portfolioStatus === "Active");
  const pipelineCount = companies.filter((c) => c.portfolioStatus === "Pipeline").length;

  const totalActive = activeCompanies.reduce((s, c) => s + c.investmentValue, 0);

  const avgScore = totalActive > 0
    ? Math.round(activeCompanies.reduce((s, c) => s + c.esgScore.overall * c.investmentValue, 0) / totalActive)
    : 0;
  const highRisk = activeCompanies.filter((c) => ["High", "Critical"].includes(c.climateRisk.transition)).length;
  // Carbon intensity: investment-weighted avg excluding electric utilities (segmented separately in carbon reporting)
  const utilityCompanies = activeCompanies.filter((c) => c.sector.includes("Electric Utilit"));
  const nonUtilityActive = activeCompanies.filter((c) => !c.sector.includes("Electric Utilit"));
  const totalNonUtility = nonUtilityActive.reduce((s, c) => s + c.investmentValue, 0);
  const avgCarbonIntensity = totalNonUtility > 0
    ? Math.round(nonUtilityActive.reduce((s, c) => s + c.carbonIntensity * c.investmentValue, 0) / totalNonUtility)
    : null;
  // Full weighted avg for AI context (more informative with the outlier noted)
  const avgCarbonIntensityFull = totalActive > 0
    ? Math.round(activeCompanies.reduce((s, c) => s + c.carbonIntensity * c.investmentValue, 0) / totalActive)
    : 0;
  const utilityLabel = utilityCompanies.length > 0 ? utilityCompanies.map(c => c.name).join(", ") : "electric utilities";
  const overdueCount = activeCompanies.reduce((s, c) => s + c.engagement.filter(e => e.status === "Overdue").length, 0);
  const plannedCount = activeCompanies.reduce((s, c) => s + c.engagement.filter(e => e.status === "Planned").length, 0);

  // Build portfolio trend — average E/S/G across active companies per period
  const allPeriods = [...new Set(
    activeCompanies.flatMap((c) => c.historicalScores.map((s) => s.period))
  )].sort((a, b) => {
    const [aq, ay] = (a.match(/Q(\d) (\d{4})/) || ["", "0", "0"]).slice(1).map(Number);
    const [bq, by] = (b.match(/Q(\d) (\d{4})/) || ["", "0", "0"]).slice(1).map(Number);
    return ay !== by ? ay - by : aq - bq;
  });
  const portfolioTrend = allPeriods.map((period) => {
    const scores = activeCompanies
      .map((c) => c.historicalScores.find((s) => s.period === period))
      .filter(Boolean) as { period: string; e: number; s: number; g: number }[];
    return {
      period,
      e: scores.length ? Math.round(scores.reduce((sum, s) => sum + s.e, 0) / scores.length) : 0,
      s: scores.length ? Math.round(scores.reduce((sum, s) => sum + s.s, 0) / scores.length) : 0,
      g: scores.length ? Math.round(scores.reduce((sum, s) => sum + s.g, 0) / scores.length) : 0,
    };
  });

  // Only compute deltas from periods where ALL active companies have data
  // to avoid composition bias (companies with fewer periods skewing the delta)
  const fullCoverageTrend = portfolioTrend.filter((_, i) => {
    const period = allPeriods[i];
    return activeCompanies.every(c => c.historicalScores.some(s => s.period === period));
  });
  const lastTrend = fullCoverageTrend[fullCoverageTrend.length - 1];
  const prevTrend = fullCoverageTrend[fullCoverageTrend.length - 2];
  const eDelta = lastTrend && prevTrend ? lastTrend.e - prevTrend.e : 0;
  const sDelta = lastTrend && prevTrend ? lastTrend.s - prevTrend.s : 0;
  const gDelta = lastTrend && prevTrend ? lastTrend.g - prevTrend.g : 0;
  // Use raw sum check so individual-pillar badges show even when avg rounds to 0
  const deltaSum = eDelta + sDelta + gDelta;
  const avgDelta = deltaSum !== 0 ? Math.round(deltaSum / 3) : 0;
  // Dynamic period label derived from data — never stale as new periods are added
  const deltaLabel = lastTrend && prevTrend ? `${lastTrend.period} vs ${prevTrend.period}` : "";

  const portfolioSummary = activeCompanies.map((c) => {
    const topIssue = [...c.materialIssues]
      .filter((i) => !i.opportunity)
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))[0];
    return (
      `${c.name} (${c.sector}, ${c.country}): ESG ${c.esgScore.overall}/100 [E:${c.esgScore.environmental} S:${c.esgScore.social} G:${c.esgScore.governance}], ` +
      `Maturity: ${c.maturity}, Transition Risk: ${c.climateRisk.transition}, Nature Risk: ${c.natureRisk.overall}, ` +
      `Carbon Intensity: ${c.carbonIntensity} tCO2e/$M (non-utility portfolio avg: ${avgCarbonIntensity ?? "N/A"} tCO2e/$M, full portfolio avg incl. ${utilityLabel}: ${avgCarbonIntensityFull} tCO2e/$M), Green Revenue: ${c.greenRevenuePct}%, ` +
      `Overdue engagements: ${c.engagement.filter(e => e.status === "Overdue").length}, Planned: ${c.engagement.filter(e => e.status === "Planned").length}, ` +
      `Top issue: ${topIssue ? `${topIssue.issue} (${topIssue.severity})` : "None"}`
    );
  }).join(" || ");

  const bubbleData = activeCompanies.map((c) => ({
    name: c.name,
    esgScore: c.esgScore.overall,
    carbonIntensity: c.carbonIntensity,
    investmentValue: c.investmentValue,
    transitionRisk: c.climateRisk.transition,
    slug: c.slug,
  }));

  return (
    <div className="p-8">
      {showDemoBanner && (
        <div role="status" aria-live="polite" className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 text-xs text-amber-800 flex items-center gap-2">
          <span aria-hidden="true">⚠</span>
          <span>Using demo data — live portfolio database unavailable. Check Supabase connection.</span>
        </div>
      )}
      <PageHeader
        title="Portfolio Overview"
        subtitle="ESG investment intelligence across your active portfolio — climate, nature, and social."
      >
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 rounded-lg px-3 py-2 border border-gray-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          S${(totalActive / 1000).toFixed(1)}B active
          {pipelineCount > 0 && (
            <span className="flex items-center gap-1 text-blue-700 ml-1">
              · <GitMerge className="w-3 h-3" /> {pipelineCount} pipeline
            </span>
          )}
        </div>
      </PageHeader>

      {/* Portfolio Health Bar */}
      {activeCompanies.length === 0 ? (
        <div className="mb-6 rounded-xl px-6 py-4 border bg-gray-50 border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-600 mb-0.5">Portfolio ESG Health</div>
            <div className="text-sm text-gray-500 italic">No active companies — add companies via the admin panel</div>
          </div>
        </div>
      ) : (
      <div className={`mb-6 rounded-xl px-6 py-4 border flex items-center justify-between ${
        avgScore >= 65 ? "bg-emerald-50 border-emerald-200" :
        avgScore >= 40 ? "bg-amber-50 border-amber-200" :
        "bg-red-50 border-red-200"
      }`}>
        <div>
          <div className="text-xs font-medium text-gray-600 mb-0.5">Portfolio ESG Health</div>
          <div className={`text-2xl font-bold ${
            avgScore >= 65 ? "text-emerald-700" : avgScore >= 40 ? "text-amber-700" : "text-red-700"
          }`}>{avgScore}<span className="text-sm font-normal text-gray-500">/100</span></div>
        </div>
        <div className="flex-1 mx-8">
          <div className="h-3 bg-white/60 rounded-full overflow-hidden border border-white/40">
            <div className={`h-full rounded-full transition-all ${
              avgScore >= 65 ? "bg-emerald-500" : avgScore >= 40 ? "bg-amber-500" : "bg-red-500"
            }`} style={{ width: `${avgScore}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-500">
            <span>0</span><span>50</span><span>100</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            avgScore >= 65 ? "text-emerald-700 bg-emerald-100 border-emerald-300" :
            avgScore >= 40 ? "text-amber-700 bg-amber-100 border-amber-300" :
            "text-red-700 bg-red-100 border-red-300"
          }`}>
            {avgScore >= 65 ? "Strong" : avgScore >= 40 ? "Developing" : "Needs Attention"}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">{activeCompanies.length} active companies</div>
        </div>
      </div>
      )}

      {/* KPI Row — scoped to Active portfolio */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <div>
          <StatCard label="Portfolio ESG Score" value={avgScore} sub="Active companies · investment-weighted" color="green" />
          {(avgDelta !== 0 || eDelta !== 0 || sDelta !== 0 || gDelta !== 0) && (
            <div className="mt-1 flex flex-wrap gap-1">
              {avgDelta !== 0 && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded border ${
                  avgDelta > 0 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"
                }`} title={deltaLabel}>{avgDelta > 0 ? `↑ +${avgDelta}` : `↓ ${avgDelta}`} {deltaLabel}</span>
              )}
              {[{k:"E", v:eDelta},{k:"S", v:sDelta},{k:"G", v:gDelta}].map(({k,v}) => v !== 0 && (
                <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  v > 0 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"
                }`} title={deltaLabel}>{k}{v > 0 ? `+${v}` : v}</span>
              ))}
            </div>
          )}
        </div>
        <StatCard label="Transition Risk Flags" value={highRisk} sub="High or Critical exposure" color="amber" />
        <StatCard label="Avg Carbon Intensity" value={avgCarbonIntensity !== null ? `${avgCarbonIntensity}` : "N/A"} sub="tCO₂e/$M revenue · ex-utilities weighted avg" color="default" />
        <StatCard label="Overdue Engagements" value={overdueCount} sub="Requires immediate follow-up" color="red" />
        <StatCard label="Planned Engagements" value={plannedCount} sub="Upcoming" color="default" />
      </div>

      {/* Paris Pathway Alignment Widget */}
      <ParisPathwayWidget companies={activeCompanies.map(c => ({ name: c.name, pathwayAlignment: c.climateRisk.pathwayAlignment, investmentValue: c.investmentValue }))} />

      {/* Portfolio ESG Attribution */}
      <PortfolioESGAttribution companies={activeCompanies} />

      {/* Needs Attention Alerts */}
      <AlertPanel companies={companies} />

      {/* Portfolio ESG Trend */}
      <PortfolioTrend data={fullCoverageTrend} activeCount={activeCompanies.length} />

      {/* Carbon Intensity Comparison */}
      {activeCompanies.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Carbon Intensity by Company</h2>
          <p className="text-xs text-gray-500 mb-4">tCO₂e per S$M revenue — lower is better · IEA ASEAN 2030 target: &lt;500 tCO₂e/$M</p>
          <div className="space-y-2.5">
            {(() => {
              const maxIntensity = Math.max(...activeCompanies.map(c => c.carbonIntensity), 1);
              return [...activeCompanies].sort((a, b) => b.carbonIntensity - a.carbonIntensity).map(co => {
              const pct = Math.min((co.carbonIntensity / maxIntensity) * 100, 100);
              const isHighEmitter = co.carbonIntensity > 500;
              const color = co.carbonIntensity < 100 ? "bg-emerald-500" : co.carbonIntensity < 500 ? "bg-amber-500" : "bg-red-500";
              return (
                <div key={co.slug} className="flex items-center gap-3">
                  <span className="text-xs text-gray-700 w-36 flex-shrink-0 truncate" title={co.name}>{co.name}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-sm overflow-hidden relative">
                    <div className={`h-full rounded-sm ${color} transition-all`} style={{ width: `${pct}%` }} />
                    {/* IEA benchmark line at 500/max */}
                    {maxIntensity > 500 && (
                      <div className="absolute top-0 bottom-0 w-px bg-gray-400 opacity-60" style={{ left: `${Math.min((500 / maxIntensity) * 100, 100)}%` }} />
                    )}
                  </div>
                  <span className={`text-xs font-medium w-20 text-right flex-shrink-0 ${isHighEmitter ? "text-red-700" : "text-gray-700"}`}>
                    {co.carbonIntensity.toLocaleString("en-SG")} tCO₂/$M
                  </span>
                </div>
              );
            });
            })()}
          </div>
          {activeCompanies.some(c => c.carbonIntensity > 500) && (
            <p className="text-[10px] text-gray-500 mt-3">│ = IEA ASEAN 2030 benchmark (500 tCO₂e/$M)</p>
          )}
        </div>
      )}

      {/* Portfolio Positioning Bubble Chart */}
      <PortfolioBubbleChart data={bubbleData} />

      {/* Portfolio Companies Table */}
      <div className="bg-white rounded-xl border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Companies</h2>
          <Link href="/scout" className="text-xs text-purple-700 hover:text-purple-800 flex items-center gap-1">
            Scout new deals <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]" aria-label="Active and pipeline portfolio companies">
            <thead>
              <tr className="border-b border-gray-200">
                <th scope="col" className="text-left text-xs text-gray-500 font-medium px-6 py-3">Company</th>
                <th scope="col" className="text-left text-xs text-gray-500 font-medium px-4 py-3">Status</th>
                <th scope="col" className="text-left text-xs text-gray-500 font-medium px-4 py-3">Rating</th>
                <th scope="col" className="text-left text-xs text-gray-500 font-medium px-4 py-3">E</th>
                <th scope="col" className="text-left text-xs text-gray-500 font-medium px-4 py-3">S</th>
                <th scope="col" className="text-left text-xs text-gray-500 font-medium px-4 py-3">G</th>
                <th scope="col" className="text-left text-xs text-gray-500 font-medium px-4 py-3">Maturity</th>
                <th scope="col" className="text-left text-xs text-gray-500 font-medium px-4 py-3">Portfolio Weight</th>
                <th scope="col" className="text-left text-xs text-gray-500 font-medium px-4 py-3">Transition Risk</th>
                <th scope="col" className="text-right text-xs text-gray-500 font-medium px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((co) => (
                <tr key={co.slug} className="border-b border-gray-200 last:border-0 hover:bg-gray-100 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/scout/${co.slug}`} className="font-medium text-gray-900 text-sm hover:text-purple-700 transition-colors">{co.name}</Link>
                    <div className="text-xs text-gray-500">{co.country}</div>
                  </td>
                  <td className="px-4 py-4">
                    {co.portfolioStatus === "Pipeline" ? (
                      <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-300 px-1.5 py-0.5 rounded w-fit">
                        <GitMerge className="w-2.5 h-2.5" /> Pipeline
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <RatingBadge rating={co.esgScore.rating} />
                  </td>
                  <td className="px-4 py-4">
                    <ScoreBar value={co.esgScore.environmental} />
                  </td>
                  <td className="px-4 py-4">
                    <ScoreBar value={co.esgScore.social} />
                  </td>
                  <td className="px-4 py-4">
                    <ScoreBar value={co.esgScore.governance} />
                  </td>
                  <td className="px-4 py-4">
                    <MaturityBadge level={co.maturity} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-gray-600">
                      {co.portfolioStatus === "Pipeline" ? "Pipeline" : totalActive > 0 ? `${(co.investmentValue / totalActive * 100).toFixed(1)}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <TransitionRiskDot level={co.climateRisk.transition} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/scout/${co.slug}`} className="text-xs text-purple-700 hover:text-purple-800" aria-label={`View ${co.name} ESG profile`}>
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Portfolio ESG Brief — below table */}
      <RiskHeatmap companies={companies} />
      <ESGDimensionHeatmap companies={companies} />
      <PCAFFinancedEmissionsTable companies={activeCompanies} totalActive={totalActive} />
      <PortfolioBrief portfolioSummary={portfolioSummary} companyNames={activeCompanies.map(c => c.name)} />

      {/* Megatrend Cards */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">ESG Megatrends</h2>
        <Link href="/signal" className="text-xs text-purple-700 hover:text-purple-800 flex items-center gap-1">
          View all signals <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {megatrends.slice(0, 3).map((t) => {
          return (
            <Link
              key={t.slug}
              href={`/signal/${t.slug}`}
              className={`bg-white rounded-xl border p-4 hover:opacity-90 transition-opacity ${overviewColorMap[t.color] ?? "border-gray-200 bg-gray-100"}`}
            >
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded mb-3 ${overviewUrgencyMap[t.urgency] ?? "text-gray-600 bg-gray-200"}`}>
                {t.urgency}
              </span>
              <div className="font-semibold text-gray-900 text-sm mb-1">{t.title}</div>
              <div className="text-xs text-gray-600">{t.subtitle}</div>
            </Link>
          );
        })}
      </div>
      {megatrends.length > 3 && (
      <div className="mt-2 text-right">
        <Link href="/signal" className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 justify-end">
          and {megatrends.length - 3} more · View all {megatrends.length} signals <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      )}

      {/* Megatrend × Company Exposure Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Megatrend Exposure Matrix</h2>
        <p className="text-xs text-gray-500 mb-4">Active portfolio × ESG megatrend · High = direct material exposure</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[500px]" aria-label="Megatrend exposure matrix — active portfolio companies vs ESG megatrends">
            <thead>
              <tr className="border-b border-gray-100">
                <th scope="col" className="text-left pb-2 pr-4 text-gray-500 font-medium w-40">Company</th>
                {megatrends.map(t => (
                  <th key={t.slug} scope="col" title={t.title} className="text-center pb-2 px-2 text-gray-500 font-medium max-w-[80px]">
                    <span className="block truncate text-[10px]">{t.title.split(" ").slice(0, 2).join(" ")}</span>
                    <span className="block truncate text-[10px]">{t.title.split(" ").slice(2, 4).join(" ")}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeCompanies.map(co => (
                <tr key={co.slug} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <th scope="row" className="py-2 pr-4 font-medium text-gray-800 truncate max-w-[160px] text-left" title={co.name}>
                    <Link href={`/scout/${co.slug}`} className="hover:text-purple-700 transition-colors">{co.name}</Link>
                  </th>
                  {megatrends.map(t => {
                    const exposure = t.portfolioExposure.find(p => p.slug === co.slug);
                    const level = exposure?.exposure ?? "Low";
                    const cellStyle = level === "High" ? "bg-red-100 text-red-700 border border-red-200" :
                      level === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-gray-50 text-gray-500 border border-gray-200";
                    return (
                      <td key={t.slug} className="py-2 px-2 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cellStyle}`}>{level[0]}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-gray-500 mt-2">H = High · M = Medium · L = Low exposure</p>
      </div>
    </div>
  );
}

function ESGDimensionHeatmap({ companies }: { companies: Array<{ name: string; slug: string; esgScore: { environmental: number; social: number; governance: number; overall: number }; portfolioStatus: string }> }) {
  const active = companies.filter(c => c.portfolioStatus === "Active");

  const scoreColor = (score: number) =>
    score >= 65 ? "bg-emerald-100 text-emerald-800 font-semibold" :
    score >= 40 ? "bg-amber-100 text-amber-800 font-semibold" :
    score >= 25 ? "bg-orange-100 text-orange-800 font-semibold" :
    "bg-red-100 text-red-800 font-semibold";

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">ESG Dimension Heatmap</h2>
        <p className="text-xs text-gray-500 mt-0.5">E/S/G scores per active company — color indicates performance level</p>
      </div>
      <div className="p-5 overflow-x-auto">
        <table className="w-full text-xs" aria-label="ESG dimension heatmap — risk exposure by company and ESG pillar">
          <thead>
            <tr className="text-gray-500 font-medium">
              <th scope="col" className="text-left pb-3 pr-4 w-40">Company</th>
              <th scope="col" className="text-center pb-3 px-3 w-24">Environmental</th>
              <th scope="col" className="text-center pb-3 px-3 w-24">Social</th>
              <th scope="col" className="text-center pb-3 px-3 w-24">Governance</th>
              <th scope="col" className="text-center pb-3 px-3 w-24">Overall</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[...active].sort((a, b) => b.esgScore.overall - a.esgScore.overall).map(co => (
              <tr key={co.slug}>
                <td className="py-2.5 pr-4">
                  <Link href={`/scout/${co.slug}`} className="text-gray-800 font-medium hover:text-purple-700 transition-colors">{co.name}</Link>
                </td>
                {(["environmental", "social", "governance", "overall"] as const).map(dim => (
                  <td key={dim} className="py-2.5 px-3 text-center">
                    <span className={`inline-block w-12 py-0.5 rounded text-center ${scoreColor(co.esgScore[dim])}`}>
                      {co.esgScore[dim]}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium">Score legend:</span>
          {[{ label: "≥65 Strong", cls: "bg-emerald-100 text-emerald-800" }, { label: "40–64 Developing", cls: "bg-amber-100 text-amber-800" }, { label: "25–39 Lagging", cls: "bg-orange-100 text-orange-800" }, { label: "<25 Critical", cls: "bg-red-100 text-red-800" }].map(l => (
            <span key={l.label} className={`text-xs px-2 py-0.5 rounded font-medium ${l.cls}`}>{l.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const color =
    value >= 65 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : value >= 25 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-600">{value}</span>
    </div>
  );
}

function TransitionRiskDot({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Low: "bg-emerald-500",
    Medium: "bg-amber-500",
    High: "bg-orange-500",
    Critical: "bg-red-500",
  };
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[level] ?? "bg-slate-500"}`} />
      <span className="text-xs text-gray-600">{level}</span>
    </div>
  );
}

function ParisPathwayWidget({ companies }: { companies: { pathwayAlignment: string; investmentValue: number; name: string }[] }) {
  const active = companies;
  const total = active.reduce((s, c) => s + c.investmentValue, 0);

  const tiers = [
    { label: "1.5°C", color: "bg-emerald-600", textColor: "text-emerald-700", companies: active.filter(c => c.pathwayAlignment === "1.5°C") },
    { label: "2°C", color: "bg-amber-500", textColor: "text-amber-700", companies: active.filter(c => c.pathwayAlignment === "2°C") },
    { label: "3°C+", color: "bg-red-600", textColor: "text-red-700", companies: active.filter(c => c.pathwayAlignment === "3°C+") },
    { label: "Not assessed", color: "bg-gray-400", textColor: "text-gray-600", companies: active.filter(c => c.pathwayAlignment === "Not assessed") },
  ].filter(t => t.companies.length > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Paris Pathway Alignment — Active Portfolio</h2>
      {total > 0 ? (
        <>
          {/* Stacked bar */}
          <div role="img" aria-label="Paris Pathway alignment stacked bar" className="w-full h-4 rounded-full overflow-hidden flex mb-4">
            {tiers.map(tier => {
              const tierAUM = tier.companies.reduce((s, c) => s + c.investmentValue, 0);
              const pct = (tierAUM / total) * 100;
              return (
                <div
                  key={tier.label}
                  className={tier.color}
                  style={{ width: `${pct}%` }}
                  title={`${tier.label}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>
          {/* Legend */}
          <div className="space-y-2">
            {tiers.map(tier => {
              const tierAUM = tier.companies.reduce((s, c) => s + c.investmentValue, 0);
              const pct = total > 0 ? (tierAUM / total) * 100 : 0;
              return (
                <div key={tier.label} className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${tier.color}`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-semibold ${tier.textColor}`}>{tier.label}</span>
                    <span className="text-xs text-gray-500 ml-2">{pct.toFixed(1)}% AUM</span>
                    <span className="text-xs text-gray-600 ml-2">— {tier.companies.map(c => c.name).join(", ")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-500">No active companies.</p>
      )}
    </div>
  );
}

function PortfolioESGAttribution({ companies }: { companies: Company[] }) {
  // Use only periods where ALL companies have data to avoid composition bias
  // (same principle as fullCoverageTrend in the avgDelta badge)
  const allPeriodsSorted = [...new Set(
    companies.flatMap(co => co.historicalScores.map(s => s.period))
  )].sort((a, b) => {
    const [aq, ay] = (a.match(/Q(\d) (\d{4})/) || ["","0","0"]).slice(1).map(Number);
    const [bq, by] = (b.match(/Q(\d) (\d{4})/) || ["","0","0"]).slice(1).map(Number);
    return ay !== by ? ay - by : aq - bq;
  });

  // Filter to full-coverage periods (all companies have a score entry)
  const fullCoveragePeriods = allPeriodsSorted.filter(period =>
    companies.every(co => co.historicalScores.some(s => s.period === period))
  );

  if (fullCoveragePeriods.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Portfolio ESG Attribution</h2>
        <p className="text-xs text-gray-500">Insufficient historical data — at least two score periods required to compute attribution.</p>
      </div>
    );
  }

  const Q1 = fullCoveragePeriods[fullCoveragePeriods.length - 2];
  const Q2 = fullCoveragePeriods[fullCoveragePeriods.length - 1];

  const rows = companies
    .map(co => {
      const q1 = co.historicalScores.find(s => s.period === Q1);
      const q2 = co.historicalScores.find(s => s.period === Q2);
      if (!q1 || !q2) return null;
      const avg1 = (q1.e + q1.s + q1.g) / 3;
      const avg2 = (q2.e + q2.s + q2.g) / 3;
      const delta = Math.round((avg2 - avg1) * 10) / 10;
      return { name: co.name, slug: co.slug, delta };
    })
    .filter((r): r is { name: string; slug: string; delta: number } => r !== null)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  if (rows.length === 0) return null;

  const maxAbs = Math.max(...rows.map(r => Math.abs(r.delta)), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Portfolio ESG Change — {Q2} vs {Q1}</h2>
      <p className="text-xs text-gray-500 mb-4">
        Average (E+S+G)/3 score delta per company, sorted by absolute change
        {rows.length < companies.length && (
          <span className="ml-1 text-amber-600">· {companies.length - rows.length} company(ies) excluded (missing {Q1}/{Q2} data)</span>
        )}
      </p>
      <div className="space-y-2.5">
        {rows.map(({ name, slug, delta }) => {
          const barPct = (Math.abs(delta) / maxAbs) * 100;
          const isPositive = delta > 0;
          const isNeutral = delta === 0;
          return (
            <div key={slug} className="flex items-center gap-3">
              <span className="text-xs text-gray-700 w-44 flex-shrink-0 truncate" title={name}>{name}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-4 bg-gray-100 rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm ${isPositive ? "bg-emerald-500" : isNeutral ? "bg-gray-400" : "bg-red-500"}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold w-10 text-right flex-shrink-0 ${isPositive ? "text-emerald-700" : isNeutral ? "text-gray-500" : "text-red-700"}`}>
                  {isPositive ? "+" : ""}{delta.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Improved
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Declined
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-2.5 h-2.5 rounded-sm bg-gray-400" /> Unchanged
        </div>
      </div>
    </div>
  );
}

function PCAFFinancedEmissionsTable({ companies, totalActive }: { companies: Company[]; totalActive: number }) {
  const pcafScore = (commitment: string): number => {
    if (commitment === "SBTi Targets Set") return 2;
    if (commitment === "SBTi Committed") return 3;
    if (commitment === "Net Zero Pledged") return 4;
    return 5;
  };

  const pcafLabel: Record<number, string> = {
    2: "Reported, 3rd-party verified",
    3: "Reported",
    4: "Estimated from company data",
    5: "Modeled from sector averages",
  };

  const rows = companies.map(co => {
    const stake = totalActive > 0 ? (co.investmentValue / totalActive) * 100 : 0;
    const estimatedEmissions = totalActive > 0 ? Math.round((co.investmentValue / totalActive) * co.carbonIntensity * 2500) : 0;
    const score = pcafScore(co.netZeroCommitment);
    return { co, stake, estimatedEmissions, score };
  });

  const totalEmissions = rows.reduce((s, r) => s + r.estimatedEmissions, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 id="pcaf-table-heading" className="text-sm font-semibold text-gray-900">PCAF Financed Emissions</h2>
        <p className="text-xs text-gray-500 mt-0.5">Simplified proxy — investment-weighted carbon intensity allocation</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" aria-labelledby="pcaf-table-heading">
          <thead>
            <tr className="border-b border-gray-200">
              <th scope="col" className="text-left text-xs text-gray-500 font-medium px-6 py-3">Company</th>
              <th scope="col" className="text-left text-xs text-gray-500 font-medium px-4 py-3">Sector</th>
              <th scope="col" className="text-right text-xs text-gray-500 font-medium px-4 py-3">Stake ~%</th>
              <th scope="col" className="text-right text-xs text-gray-500 font-medium px-4 py-3">Est. Financed Emissions (tCO₂e)</th>
              <th scope="col" className="text-left text-xs text-gray-500 font-medium px-4 py-3">PCAF Quality (1–5)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ co, stake, estimatedEmissions, score }) => (
              <tr key={co.slug} className="border-b border-gray-200 last:border-0 hover:bg-gray-100 transition-colors">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">{co.name}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{co.sector}</td>
                <td className="px-4 py-3 text-xs text-gray-600 text-right">{stake.toFixed(1)}%</td>
                <td className="px-4 py-3 text-xs text-gray-800 text-right font-medium">{estimatedEmissions.toLocaleString("en-SG")}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    score <= 2 ? "text-emerald-700 bg-emerald-50 border-emerald-300" :
                    score === 3 ? "text-blue-700 bg-blue-50 border-blue-200" :
                    score === 4 ? "text-amber-700 bg-amber-50 border-amber-200" :
                    "text-gray-600 bg-gray-100 border-gray-200"
                  }`}>
                    {score} — {pcafLabel[score]}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold">
              <td className="px-6 py-3 text-xs text-gray-900" colSpan={3}>Portfolio Total</td>
              <td className="px-4 py-3 text-xs text-gray-900 text-right">{totalEmissions.toLocaleString("en-SG")}</td>
              <td className="px-4 py-3" />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 italic">
          Estimated using simplified proxy: (investment stake % × carbon intensity × S$2,500M assumed portfolio revenue). For illustration only — full PCAF calculation requires enterprise value and verified absolute Scope 1+2+3 emissions per PCAF Global Standard v2 (2020).
        </p>
      </div>
    </div>
  );
}
