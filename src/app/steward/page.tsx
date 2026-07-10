"use client";
import { useState } from "react";
import { companies } from "@/data/companies";
import { RatingBadge, MaturityBadge, RiskBadge, PageHeader } from "@/components/ui-elements";
import { Loader2, FileText, CheckCircle, Clock, ChevronDown, ChevronUp, Copy, GitMerge, AlertCircle } from "lucide-react";
import { AIOutput } from "@/components/AIOutput";
import Link from "next/link";
import { formatRelativeTime, formatDate } from "@/lib/utils";

const SEVERITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function StewardPage() {
  const activeCompanies = companies.filter((c) => c.portfolioStatus === "Active");
  const pipelineCompanies = companies.filter((c) => c.portfolioStatus === "Pipeline");
  const [view, setView] = useState<"cards" | "calendar">("cards");

  const completedCount = activeCompanies.reduce((s, c) => s + c.engagement.filter(e => e.status === "Completed").length, 0);
  const plannedCount = activeCompanies.reduce((s, c) => s + c.engagement.filter(e => e.status === "Planned").length, 0);
  const overdueCount = activeCompanies.reduce((s, c) => s + c.engagement.filter(e => e.status === "Overdue").length, 0);

  // Sort active companies: overdue first, then by planned count descending
  const sortedActive = [...activeCompanies].sort((a, b) => {
    const overdueA = a.engagement.filter(e => e.status === "Overdue").length;
    const overdueB = b.engagement.filter(e => e.status === "Overdue").length;
    if (overdueB !== overdueA) return overdueB - overdueA;
    const plannedDiff = b.engagement.filter(e => e.status === "Planned").length - a.engagement.filter(e => e.status === "Planned").length;
    if (plannedDiff !== 0) return plannedDiff;
    return a.name.localeCompare(b.name);
  });

  // Calendar view: flatten all engagements (Planned + Overdue) from active AND pipeline companies
  const calendarEngagements = [...activeCompanies, ...pipelineCompanies]
    .flatMap((co) =>
      co.engagement
        .filter((e) => e.status === "Planned" || e.status === "Overdue")
        .map((e) => ({ ...e, companyName: co.name, companySlug: co.slug, isPipeline: co.portfolioStatus === "Pipeline" }))
    )
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return (
    <div className="p-8">
      <PageHeader
        title="Steward"
        subtitle="Post-investment portfolio engagement tracking — active company stewardship and pipeline pre-close monitoring."
      >
        <div className="flex items-center gap-3">
          <div className="text-center bg-white border border-gray-200 rounded-xl px-4 py-2">
            <div className="text-lg font-bold text-gray-900">{completedCount}</div>
            <div className="text-xs text-gray-500">Completed (active)</div>
          </div>
          <div className="text-center bg-white border border-gray-200 rounded-xl px-4 py-2">
            <div className="text-lg font-bold text-blue-700">{plannedCount}</div>
            <div className="text-xs text-gray-500">Planned (active)</div>
          </div>
          <div className="text-center bg-white border border-gray-200 rounded-xl px-4 py-2">
            <div className="text-lg font-bold text-red-700">{overdueCount}</div>
            <div className="text-xs text-gray-500">Overdue (active)</div>
          </div>
        </div>
      </PageHeader>

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 mb-6 w-fit">
        {(["cards", "calendar"] as const).map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium capitalize ${
              view === v
                ? "bg-[#4B2580]/15 text-purple-700 border border-purple-500/40"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {v === "cards" ? "Cards" : "Calendar"}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Upcoming &amp; Overdue Engagements</h2>
              <p className="text-xs text-gray-500 mt-0.5">{calendarEngagements.length} engagements across {new Set(calendarEngagements.map(e => e.companySlug)).size} companies</p>
            </div>
            {calendarEngagements.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-8">No planned or overdue engagements</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {calendarEngagements.map((e, i) => (
                  <div key={`${e.companySlug}-${e.date}-${e.topic}-${i}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    {/* Date Badge */}
                    <div className="w-16 flex-shrink-0 text-center">
                      <div className={`text-xs font-semibold px-2 py-1 rounded ${
                        e.status === "Overdue"
                          ? "bg-red-50 text-red-700 border border-red-300"
                          : "bg-blue-50 text-blue-700 border border-blue-300"
                      }`}>
                        {formatDate(e.date)}
                      </div>
                    </div>
                    {/* Company */}
                    <div className="w-40 flex-shrink-0 flex items-center gap-1.5">
                      <Link
                        href={`/scout/${e.companySlug}`}
                        className="text-xs font-medium text-purple-700 hover:text-purple-900 transition-colors truncate"
                      >
                        {e.companyName}
                      </Link>
                      {e.isPipeline && <span className="text-xs text-blue-700 flex-shrink-0">·Pipeline</span>}
                    </div>
                    {/* Topic */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-900 truncate block">{e.topic}</span>
                      <span className="text-xs text-gray-500 ml-2">{e.type}</span>
                    </div>
                    {/* Status */}
                    <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${
                      e.status === "Overdue"
                        ? "text-red-700 bg-red-50 border-red-300"
                        : "text-blue-700 bg-blue-50 border-blue-300"
                    }`}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cards View — Active Portfolio */}
      {view === "cards" && (
      <div className="space-y-4">
        {sortedActive.map((co) => (
          <PortfolioCard key={co.slug} company={co} />
        ))}
      </div>
      )}

      {/* Pipeline: Pre-Investment Due Diligence */}
      {pipelineCompanies.length > 0 && view === "cards" && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Pipeline — Pre-Investment ESG Due Diligence</h2>
            <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-300 px-2.5 py-1 rounded-full">
              <GitMerge className="w-3 h-3" /> {pipelineCompanies.length} under evaluation
            </span>
          </div>
          <div className="space-y-4">
            {pipelineCompanies.map((co) => (
              <PortfolioCard key={co.slug} company={co} isPipeline />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getEscalationLevel(co: (typeof companies)[0]): { level: number; label: string; color: string } {
  const overdueCount = co.engagement.filter(e => e.status === "Overdue").length;
  const hasCritical = co.materialIssues.some(i => i.severity === "Critical" && !i.opportunity);
  const totalEngagements = co.engagement.length;
  const completedRatio = totalEngagements > 0 ? co.engagement.filter(e => e.status === "Completed").length / totalEngagements : 0;

  if (overdueCount >= 2 || (overdueCount >= 1 && hasCritical)) return { level: 2, label: "Formal Escalation", color: "text-red-700 bg-red-50 border-red-300" };
  if (overdueCount === 1) return { level: 1, label: "Follow-up Required", color: "text-amber-700 bg-amber-50 border-amber-300" };
  if (completedRatio >= 0.6 && !hasCritical) return { level: 0, label: "On Track", color: "text-emerald-700 bg-emerald-50 border-emerald-300" };
  return { level: 0, label: "Active Monitoring", color: "text-blue-700 bg-blue-50 border-blue-300" };
}

function PortfolioCard({ company: co, isPipeline = false }: { company: (typeof companies)[0]; isPipeline?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [plan, setPlan] = useState("");
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");
  const [planGeneratedAt, setPlanGeneratedAt] = useState<Date | null>(null);

  const completedCount = co.engagement.filter((e) => e.status === "Completed").length;
  const plannedCount = co.engagement.filter((e) => e.status === "Planned").length;
  const overdueCount = co.engagement.filter((e) => e.status === "Overdue").length;

  async function generateActionPlan() {
    if (planLoading) return;
    setPlanLoading(true);
    setPlanError("");
    try {
      const topIssues = [...co.materialIssues]
        .filter((i) => !i.opportunity)
        .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))
        .slice(0, 3)
        .map((i) => `${i.issue} (${i.severity})`)
        .join(", ");
      const keyGaps = [
        co.climateRisk.transition !== "Low" && "Climate transition strategy and emissions pathway",
        co.natureRisk.overall !== "Low" && "Nature risk and TNFD assessment",
        !co.natureRisk.tnfdAligned && "TNFD adoption",
        co.netZeroCommitment === "None" && "No net zero commitment — ISSB S2 readiness gap",
        // Only flag green revenue gap for non-utilities — for electric utilities the priority is coal phase-out, not green revenue growth
        co.greenRevenuePct < 20 && !co.sector.includes("Electric Utilit") && "Green revenue development",
      ]
        .filter(Boolean)
        .join("; ");

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "action_plan",
          context: {
            name: co.name,
            sector: co.sector,
            maturity: co.maturity,
            topIssues,
            keyGaps,
          },
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      let data: { error?: string; text?: string };
      try { data = await res.json(); } catch { throw new Error(`Request failed: ${res.status} (unexpected response format)`); }
      if (data.error) throw new Error(data.error);
      if (!data.text) throw new Error("No content received from AI");
      setPlan(data.text);
      setPlanGeneratedAt(new Date());
    } catch (e: unknown) {
      setPlanError(e instanceof Error ? e.message : "Failed to generate action plan");
    } finally {
      setPlanLoading(false);
    }
  }

  return (
    <div className={`bg-white rounded-xl border transition-colors ${
      isPipeline
        ? "border-blue-500/20 hover:border-blue-500/30"
        : "border-gray-200 hover:border-gray-200"
    }`}>
      {/* Card Header — click anywhere to expand */}
      <div
        className="p-5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-inset rounded-t-xl"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${co.name} engagement card, ${expanded ? "expanded" : "collapsed"}`}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if ((e.target as HTMLElement).closest('a,button')) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(!expanded); } }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Link
                href={`/scout/${co.slug}`}
                className="font-semibold text-gray-900 hover:text-purple-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {co.name}
              </Link>
              <RatingBadge rating={co.esgScore.rating} />
              <MaturityBadge level={co.maturity} />
              {!isPipeline && (() => {
                const esc = getEscalationLevel(co);
                return (
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${esc.color}`}>
                    {esc.label}
                  </span>
                );
              })()}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{co.sector}</span>
              <span>·</span>
              <span>{co.country}</span>
              <span>·</span>
              <span>Last updated: {formatDate(co.lastUpdated)}</span>
            </div>
          </div>

          {/* Right side: scores + engagement counts */}
          <div className="flex items-center gap-6 ml-4">
            <div className="flex items-center gap-3">
              <ESGMini label="E" value={co.esgScore.environmental} />
              <ESGMini label="S" value={co.esgScore.social} />
              <ESGMini label="G" value={co.esgScore.governance} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-gray-700">{completedCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-gray-700">{plannedCount}</span>
              </div>
              {overdueCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-red-700 font-medium">{overdueCount}</span>
                </div>
              )}
            </div>
            <div className="text-gray-500">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Risk quick view */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
          <RiskItem label="Physical" level={co.climateRisk.physical} />
          <RiskItem label="Transition" level={co.climateRisk.transition} />
          <RiskItem label="Nature" level={co.natureRisk.overall} />
          <div className="ml-auto text-xs text-gray-500">
            Carbon intensity: <span className="text-gray-700">{co.carbonIntensity} tCO₂e/$M</span>
            <span className="mx-2">·</span>
            Green revenue: <span className="text-emerald-700">{co.greenRevenuePct}%</span>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-gray-200 p-5 space-y-5">
          {/* Engagement Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Engagement History</h3>
            <div className="space-y-2">
              {[...co.engagement].sort((a, b) => {
                // Sort chronologically descending (most recent first) so history reads naturally
                return a.date > b.date ? -1 : a.date < b.date ? 1 : 0;
              }).map((e, i) => (
                <div key={`${e.date}-${e.topic}-${i}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    e.status === "Completed" ? "bg-emerald-500" :
                    e.status === "Planned" ? "bg-blue-500" : "bg-red-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-gray-900">{e.topic}</span>
                      <span className="text-xs text-gray-600">{e.type}</span>
                      <span className="text-xs text-gray-600">{formatDate(e.date)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${
                        e.status === "Completed" ? "text-emerald-700 bg-emerald-50 border-emerald-300" :
                        e.status === "Planned" ? "text-blue-700 bg-blue-50 border-blue-300" :
                        "text-red-700 bg-red-50 border-red-300"
                      }`}>{e.status}</span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-3">{e.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ESG Action Plan Generator — Active companies only */}
          {isPipeline ? (
            <div className="text-xs text-gray-500 border border-dashed border-gray-200 rounded-lg p-4 text-center">
              ESG Action Plan available after investment close. IC conditions precedent tracked in engagement history above.
            </div>
          ) : <div aria-live="polite" aria-atomic="false">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">ESG Action Plan</h3>
                <p className="text-xs text-gray-500 mt-0.5">AI-generated 12-month ESG engagement roadmap with quarterly milestones</p>
              </div>
              <button
                type="button"
                onClick={generateActionPlan}
                disabled={planLoading}
                aria-busy={planLoading}
                className="flex items-center gap-2 text-sm bg-[#4B2580] hover:bg-[#3D1A6E] disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                {planLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {planLoading ? "Generating..." : plan ? "Regenerate Plan" : "Generate Plan"}
              </button>
            </div>
            {planError && (
              <div role="alert" className="text-xs text-red-700 bg-red-50 border border-red-300 rounded-lg p-3 mb-3">
                {planError}
              </div>
            )}
            {plan ? (
              <>
                {planLoading && <div className="text-xs text-gray-500 text-center py-2 mb-2">Regenerating…</div>}
                <AIOutput text={plan} />
                <div className="mt-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(plan)?.catch(() => {})}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy to clipboard
                  </button>
                  <span className="text-xs text-gray-500 ml-auto">
                    {planGeneratedAt ? `Generated ${formatRelativeTime(planGeneratedAt)}` : ""}
                  </span>
                </div>
              </>
            ) : planLoading ? (
              <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg animate-pulse">
                Generating action plan…
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg">
                <div>Generate a Temasek-style 12-month ESG engagement action plan with quarterly milestones and KPIs</div>
                <div className="text-gray-500 mt-1">Requires GEMINI_API_KEY in .env.local</div>
              </div>
            )}
          </div>}
        </div>
      )}
    </div>
  );
}

function ESGMini({ label, value }: { label: string; value: number }) {
  const color =
    value >= 70 ? "text-emerald-700" : value >= 55 ? "text-amber-600" : value >= 40 ? "text-orange-600" : "text-red-600";
  return (
    <div className="text-center">
      <div className={`text-sm font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function RiskItem({ label, level }: { label: string; level: "Low" | "Medium" | "High" | "Critical" }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">{label}:</span>
      <RiskBadge level={level} />
    </div>
  );
}
