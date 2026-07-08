import Link from "next/link";
import { companies } from "@/data/companies";
import { megatrends } from "@/data/megatrends";
import { RatingBadge, MaturityBadge, PageHeader, StatCard } from "@/components/ui-elements";
import { PortfolioBrief } from "@/components/PortfolioBrief";
import { PortfolioTrend } from "@/components/PortfolioTrend";
import { PortfolioBubbleChart } from "@/components/PortfolioBubbleChart";
import { AlertPanel } from "@/components/AlertPanel";
import { ArrowRight, GitMerge } from "lucide-react";

export default function OverviewPage() {
  const activeCompanies = companies.filter((c) => c.portfolioStatus === "Active");
  const pipelineCount = companies.filter((c) => c.portfolioStatus === "Pipeline").length;

  const totalActive = activeCompanies.reduce((s, c) => s + c.investmentValue, 0);

  const avgScore = totalActive > 0
    ? Math.round(activeCompanies.reduce((s, c) => s + c.esgScore.overall * c.investmentValue, 0) / totalActive)
    : 0;
  const highRisk = activeCompanies.filter((c) => ["High", "Critical"].includes(c.climateRisk.transition)).length;
  const avgCarbonIntensity = totalActive > 0
    ? Math.round(activeCompanies.reduce((s, c) => s + c.carbonIntensity * c.investmentValue, 0) / totalActive)
    : 0;
  const overdueCount = activeCompanies.reduce((s, c) => s + c.engagement.filter(e => e.status === "Overdue").length, 0);
  const plannedCount = activeCompanies.reduce((s, c) => s + c.engagement.filter(e => e.status === "Planned").length, 0);

  // Build portfolio trend — average E/S/G across active companies per period
  const allPeriods = [...new Set(
    activeCompanies.flatMap((c) => c.historicalScores.map((s) => s.period))
  )].sort((a, b) => {
    const [aq, ay] = (a.match(/Q(\d) (\d{4})/) || ["", "1", "2000"]).slice(1).map(Number);
    const [bq, by] = (b.match(/Q(\d) (\d{4})/) || ["", "1", "2000"]).slice(1).map(Number);
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

  const portfolioSummary = activeCompanies.map((c) => (
    `${c.name} (${c.sector}, ${c.country}): ESG ${c.esgScore.overall}/100 [E:${c.esgScore.environmental} S:${c.esgScore.social} G:${c.esgScore.governance}], ` +
    `Maturity: ${c.maturity}, Transition Risk: ${c.climateRisk.transition}, Nature Risk: ${c.natureRisk.overall}, ` +
    `Carbon Intensity: ${c.carbonIntensity} tCO2e/$M (portfolio avg: ${avgCarbonIntensity} tCO2e/$M), Green Revenue: ${c.greenRevenuePct}%, ` +
    `Overdue engagements: ${c.engagement.filter(e => e.status === "Overdue").length}, Planned: ${c.engagement.filter(e => e.status === "Planned").length}, ` +
    `Top issue: ${c.materialIssues[0] ? `${c.materialIssues[0].issue} (${c.materialIssues[0].severity})` : "None"}`
  )).join("\n");

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
      <PageHeader
        title="Portfolio Overview"
        subtitle="ESG investment intelligence across your active portfolio — climate, nature, and social."
      >
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/5 rounded-lg px-3 py-2 border border-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          S${(totalActive / 1000).toFixed(1)}B active
          {pipelineCount > 0 && (
            <span className="flex items-center gap-1 text-blue-400 ml-1">
              · <GitMerge className="w-3 h-3" /> {pipelineCount} pipeline
            </span>
          )}
        </div>
      </PageHeader>

      {/* KPI Row — scoped to Active portfolio */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="Portfolio ESG Score" value={avgScore} sub="Active companies (E+S+G avg)" color="green" />
        <StatCard label="Transition Risk Flags" value={highRisk} sub="High or Critical exposure" color="amber" />
        <StatCard label="Avg Carbon Intensity" value={`${avgCarbonIntensity}`} sub="tCO₂e/$M revenue · active cos" color="default" />
        <StatCard label="Overdue Engagements" value={overdueCount} sub="Requires immediate follow-up" color="red" />
        <StatCard label="Planned Engagements" value={plannedCount} sub="Upcoming" color="default" />
      </div>

      {/* Needs Attention Alerts */}
      <AlertPanel companies={companies} />

      {/* Portfolio ESG Trend */}
      <PortfolioTrend data={portfolioTrend} activeCount={activeCompanies.length} />

      {/* Portfolio Positioning Bubble Chart */}
      <PortfolioBubbleChart data={bubbleData} />

      {/* Portfolio Companies Table */}
      <div className="bg-[#0d1526] rounded-xl border border-white/5 mb-8">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Companies</h2>
          <Link href="/scout" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            Scout new deals <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-slate-500 font-medium px-6 py-3">Company</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Status</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Rating</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">E</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">S</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">G</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Maturity</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Portfolio Weight</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Transition Risk</th>
                <th className="text-right text-xs text-slate-500 font-medium px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((co) => (
                <tr key={co.slug} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/scout/${co.slug}`} className="font-medium text-white text-sm hover:text-emerald-300 transition-colors">{co.name}</Link>
                    <div className="text-xs text-slate-500">{co.country}</div>
                  </td>
                  <td className="px-4 py-4">
                    {co.portfolioStatus === "Pipeline" ? (
                      <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded w-fit">
                        <GitMerge className="w-2.5 h-2.5" /> Pipeline
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Active</span>
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
                    <span className="text-xs text-slate-400">
                      {co.portfolioStatus === "Pipeline" ? "Pipeline" : totalActive > 0 ? `${Math.round(co.investmentValue / totalActive * 100)}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <TransitionRiskDot level={co.climateRisk.transition} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/scout/${co.slug}`} className="text-xs text-emerald-400 hover:text-emerald-300">
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
      <PortfolioBrief portfolioSummary={portfolioSummary} companyNames={activeCompanies.map(c => c.name)} />

      {/* Megatrend Cards */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">ESG Megatrends</h2>
        <Link href="/signal" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
          View all signals <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {megatrends.slice(0, 3).map((t) => {
          const colorMap: Record<string, string> = {
            emerald: "border-emerald-600/20 bg-emerald-600/5",
            green: "border-green-600/20 bg-green-600/5",
            orange: "border-orange-500/20 bg-orange-500/5",
            blue: "border-blue-500/20 bg-blue-500/5",
            purple: "border-purple-500/20 bg-purple-500/5",
          };
          const urgencyMap: Record<string, string> = {
            Immediate: "text-red-400 bg-red-500/10",
            "Near-term": "text-amber-400 bg-amber-500/10",
            "Long-term": "text-blue-400 bg-blue-500/10",
          };
          return (
            <Link
              key={t.slug}
              href={`/signal/${t.slug}`}
              className={`bg-[#0d1526] rounded-xl border p-4 hover:opacity-90 transition-opacity ${colorMap[t.color] ?? "border-white/10 bg-white/5"}`}
            >
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded mb-3 ${urgencyMap[t.urgency] ?? "text-slate-400 bg-white/10"}`}>
                {t.urgency}
              </span>
              <div className="font-semibold text-white text-sm mb-1">{t.title}</div>
              <div className="text-xs text-slate-400">{t.subtitle}</div>
            </Link>
          );
        })}
      </div>
      <div className="mt-2 text-right">
        <Link href="/signal" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 justify-end">
          and {megatrends.length - 3} more · View all {megatrends.length} signals <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const color =
    value >= 70 ? "bg-emerald-500" : value >= 50 ? "bg-amber-500" : value >= 35 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-slate-400">{value}</span>
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
      <span className="text-xs text-slate-400">{level}</span>
    </div>
  );
}
