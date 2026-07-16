"use client";
import { useState, useRef, useEffect, memo } from "react";
import { useCompanies } from "@/lib/useCompanies";
import type { Company } from "@/data/companies";
import { RatingBadge, MaturityBadge, RiskBadge, PageHeader } from "@/components/ui-elements";
import { Loader2, FileText, CheckCircle, Clock, ChevronDown, ChevronUp, Copy, GitMerge, AlertCircle, Sparkles } from "lucide-react";
import { AIOutput } from "@/components/AIOutput";
import { RelativeTime } from "@/components/RelativeTime";
import Link from "next/link";
import { formatDate, copyToClipboard, displayName } from "@/lib/utils";

const SEVERITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

// RelativeTime imported from @/components/RelativeTime

export default function StewardPage() {
  const { companies, loading: companiesLoading, showDemoBanner } = useCompanies();
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
    return a.name.localeCompare(b.name, "en-SG");
  });

  // Calendar view: flatten all engagements (Planned + Overdue) from active AND pipeline companies
  const calendarEngagements = [...activeCompanies, ...pipelineCompanies]
    .flatMap((co) =>
      co.engagement
        .filter((e) => e.status === "Planned" || e.status === "Overdue")
        .map((e) => ({ ...e, companyName: displayName(co.name), companySlug: co.slug, isPipeline: co.portfolioStatus === "Pipeline" }))
    )
    .sort((a, b) => {
      // Overdue first (action required), then Planned by date ascending
      if (a.status === "Overdue" && b.status !== "Overdue") return -1;
      if (a.status !== "Overdue" && b.status === "Overdue") return 1;
      return (a.date || "").localeCompare(b.date || "");
    });

  return (
    <div className="p-8">
      {showDemoBanner && (
        <div role="status" aria-live="polite" className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
          <span aria-hidden="true">⚠</span>
          <span>Using demo data — live portfolio database unavailable. Engagement records may not reflect current portfolio.</span>
        </div>
      )}
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
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 mb-6 w-fit" role="radiogroup" aria-label="View mode"
        onKeyDown={(e) => {
          const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
          const idx = btns.indexOf(e.target as HTMLButtonElement);
          if (idx === -1) return;
          if (e.key==="ArrowRight"||e.key==="ArrowDown") { e.preventDefault(); const n=btns[(idx+1)%btns.length]; n.click(); n.focus(); }
          if (e.key==="ArrowLeft"||e.key==="ArrowUp") { e.preventDefault(); const n=btns[(idx-1+btns.length)%btns.length]; n.click(); n.focus(); }
        }}
      >
        {(["cards", "calendar"] as const).map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => setView(v)}
            role="radio"
            aria-checked={view === v}
            tabIndex={view === v ? 0 : -1}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium capitalize ${
              view === v
                ? "bg-[#4B2580]/15 text-purple-700 border border-purple-500/40"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {v === "cards" ? "Cards" : "Timeline"}
          </button>
        ))}
      </div>

      {/* View-change status — sr-only, announces only the view name (not entire content) */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {view === "calendar" ? "Timeline view" : "Cards view"}
      </div>

      {/* Calendar View */}
      <div aria-busy={companiesLoading}>
      {view === "calendar" && (
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Upcoming &amp; Overdue Engagements</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {calendarEngagements.length} engagements across {new Set(calendarEngagements.map(e => e.companySlug)).size} companies
                {calendarEngagements.some(e => e.isPipeline) && <span className="ml-1">&middot; includes pipeline</span>}
                {" "}&middot; header stats reflect active portfolio only
              </p>
            </div>
            {calendarEngagements.length === 0 && !companiesLoading && sortedActive.length > 0 ? (
              <div className="text-xs text-gray-500 text-center py-8">No planned or overdue engagements</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {calendarEngagements.map((e, i) => (
                  <div key={`${e.companySlug}-${e.date}-${e.topic}-${i}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    {/* Date Badge */}
                    <div className="w-24 flex-shrink-0 text-center">
                      <div className={`text-xs font-semibold px-2 py-1 rounded ${
                        e.status === "Overdue"
                          ? "bg-red-50 text-red-700 border border-red-300"
                          : "bg-blue-50 text-blue-700 border border-blue-300"
                      }`}>
                        {e.date ? formatDate(e.date) : "—"}
                      </div>
                    </div>
                    {/* Company */}
                    <div className="w-44 flex-shrink-0 flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/scout/${e.companySlug}`}
                        className="text-xs font-medium text-purple-700 hover:text-purple-900 transition-colors truncate"
                        title={e.companyName}
                      >
                        {e.companyName}
                      </Link>
                      {e.isPipeline && <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Pipeline</span>}
                    </div>
                    {/* Topic */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-900 truncate block" title={e.topic}>{e.topic}</span>
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
        {sortedActive.length === 0 && !companiesLoading ? (
          <div className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-200 rounded-xl">
            No active portfolio companies — add companies via the admin panel or promote a Pipeline company to Active.
          </div>
        ) : sortedActive.map((co) => (
          <PortfolioCard key={co.slug} company={co} />
        ))}
      </div>
      )}

      {/* Onboarding prompt — shown in calendar view only when both active and calendar are empty */}
      {sortedActive.length === 0 && !companiesLoading && view === "calendar" && calendarEngagements.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-200 rounded-xl mb-4">
          No active portfolio companies — add companies via the admin panel or promote a Pipeline company to Active.
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
      </div>{/* end aria-live view wrapper */}
    </div>
  );
}

function getEscalationLevel(co: Company): { level: number; label: string; color: string } {
  const overdueCount = co.engagement.filter(e => e.status === "Overdue").length;
  const hasCritical = co.materialIssues.some(i => i.severity === "Critical" && !i.opportunity);
  const totalEngagements = co.engagement.length;
  const completedRatio = totalEngagements > 0 ? co.engagement.filter(e => e.status === "Completed").length / totalEngagements : 0;

  if (overdueCount >= 2 || (overdueCount >= 1 && hasCritical)) return { level: 2, label: "Formal Escalation", color: "text-red-700 bg-red-50 border-red-300" };
  if (overdueCount === 1) return { level: 1, label: "Follow-up Required", color: "text-amber-700 bg-amber-50 border-amber-300" };
  if (completedRatio >= 0.6 && !hasCritical) return { level: 0, label: "On Track", color: "text-emerald-700 bg-emerald-50 border-emerald-300" };
  return { level: 0, label: "Active Monitoring", color: "text-blue-700 bg-blue-50 border-blue-300" };
}

const PortfolioCard = memo(function PortfolioCard({ company: co, isPipeline = false }: { company: Company; isPipeline?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [plan, setPlan] = useState("");
  const [planLoading, setPlanLoading] = useState(false);
  const planLoadingRef = useRef(false);
  const [planError, setPlanError] = useState("");
  const [planGeneratedAt, setPlanGeneratedAt] = useState<Date | null>(null);
  const [planCopied, setPlanCopied] = useState(false);

  // Invalidate cached plan when any key company data changes — include material issue fingerprint
  // and tnfdAligned so plan clears when issues are promoted/resolved or TNFD milestone is achieved
  const issueFingerprint = co.materialIssues.filter(i => !i.opportunity).map(i => `${i.issue}:${i.severity}`).join("|");
  const engFingerprint = co.engagement.map(e => `${e.topic ?? ""}:${e.status}`).join("|");
  const upliftFingerprint = co.valueUplift.map(v => `${v.area}:${v.potential}`).join("|");
  const planKey = `${co.slug}:${co.esgScore.overall}:${co.maturity}:${co.sector}:${co.country}:${co.carbonIntensity}:${co.climateRisk.transition}:${co.natureRisk.overall}:${co.natureRisk.tnfdAligned}:${co.netZeroCommitment}:${co.greenRevenuePct}:${issueFingerprint}:${engFingerprint}:${upliftFingerprint}`;
  const prevPlanKeyRef = useRef(planKey);
  useEffect(() => {
    if (prevPlanKeyRef.current !== planKey) {
      prevPlanKeyRef.current = planKey;
      // Clear all plan state including any stale error banner
      if (plan || planError) { setPlan(""); setPlanGeneratedAt(null); setPlanError(""); }
    }
  }, [planKey, plan, planError]);

  const completedCount = co.engagement.filter((e) => e.status === "Completed").length;
  const plannedCount = co.engagement.filter((e) => e.status === "Planned").length;
  const overdueCount = co.engagement.filter((e) => e.status === "Overdue").length;

  // Progress ring shows completed vs. intended (completed + planned only).
  // Overdue engagements are missed appointments, not pending completions — including them
  // in the denominator would deflate the ring and make the aria-label semantically wrong.
  const ringTotal = completedCount + plannedCount;
  const completionPct = ringTotal > 0 ? Math.round((completedCount / ringTotal) * 100) : 0;
  const radius = 16; const circ = 2 * Math.PI * radius;
  const filled = (completionPct / 100) * circ;

  async function generateActionPlan() {
    if (planLoadingRef.current) return;
    planLoadingRef.current = true;
    setPlanLoading(true);
    setPlanError("");
    // Capture key at call-time: if company data changes while the request is in-flight,
    // prevPlanKeyRef will have already been updated by the useEffect — we discard the result.
    const capturedKey = planKey;
    try {
      const topIssues = [...co.materialIssues]
        .filter((i) => !i.opportunity && i.issue.trim() !== "")
        .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))
        .slice(0, 3)
        .map((i) => `${i.issue} (${i.severity})`)
        .join(", ") || "No specific risk issues identified — focus on value creation and governance uplift";
      const keyGapsArr = [
        co.climateRisk.transition !== "Low" && "Climate transition strategy and emissions pathway",
        co.natureRisk.overall !== "Low" && "Nature risk and TNFD assessment",
        !co.natureRisk.tnfdAligned && "TNFD adoption",
        co.netZeroCommitment === "None" && "No net zero commitment — ISSB S2 readiness gap",
        co.greenRevenuePct < 20 && !co.sector.includes("Electric Utilit") && "Green revenue development",
      ].filter(Boolean);
      const keyGaps = keyGapsArr.length > 0
        ? keyGapsArr.join("; ")
        : "No material gaps — focus on reporting quality uplift, stakeholder engagement, and ESG value creation";
      const overdueEngagements = co.engagement.filter(e => e.status === "Overdue").map(e => e.topic ?? "").filter(t => t.trim() !== "").join(", ") || "None";

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "action_plan",
          context: {
            name: displayName(co.name),
            sector: co.sector || "Unknown",
            country: co.country || "Unknown",
            maturity: co.maturity,
            esgScore: `Overall ${co.esgScore.overall}/100 (E:${co.esgScore.environmental} S:${co.esgScore.social} G:${co.esgScore.governance})`,
            transitionRisk: co.climateRisk.transition,
            carbonIntensity: `${co.carbonIntensity} tCO₂e/$M`,
            greenRevenuePct: `${co.greenRevenuePct}%`,
            netZeroCommitment: co.netZeroCommitment,
            overdueEngagements,
            topIssues,
            keyGaps,
            topUplift: co.valueUplift
              .filter(v => (v.potential === "High" || v.potential === "Medium") && v.area.trim() !== "")
              .slice(0, 3)
              .map(v => `${v.area} (${v.potential} potential)`)
              .join(", ") || "No specific value creation opportunities flagged",
          },
        }),
      });
      if (!res.ok) {
        const msg = res.status === 429 ? "API quota exceeded — please try again in a moment" : `Request failed: ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }
      let data: { error?: string; text?: string };
      try { data = await res.json(); } catch { throw new Error(`Request failed: ${res.status} (unexpected response format)`); }
      if (data.error) throw new Error(data.error);
      if (!data.text?.trim()) throw new Error("No content received from AI");
      // Discard result if company data changed while the request was in flight
      if (prevPlanKeyRef.current !== capturedKey) return;
      setPlan(data.text);
      setPlanGeneratedAt(new Date());
    } catch (e: unknown) {
      setPlanError(e instanceof Error ? e.message : "Failed to generate action plan");
    } finally {
      planLoadingRef.current = false;
      setPlanLoading(false);
    }
  }

  return (
    <div className={`bg-white rounded-xl border transition-colors ${
      isPipeline
        ? "border-blue-500/20 hover:border-blue-500/30"
        : "border-gray-200 hover:border-gray-200"
    }`}>
      {/* Persistent sr-only live region — outside hidden panel so AT hears announcements even when panel is collapsed.
          aria-label includes company name so screen readers can attribute the announcement to the correct card
          when multiple cards are mounted simultaneously. */}
      <div role="status" aria-live="polite" aria-atomic="true" aria-label={`${displayName(co.name)} plan status`} className="sr-only">
        {planLoading ? `Generating ESG action plan for ${co.name}…` : plan && !planLoading ? `${co.name}: ESG action plan ready — expand the card to read` : planError ? `${co.name} action plan error: ${planError}` : ""}
      </div>
      {/* Card Header */}
      <div className="p-5">
        {/* Company name row — outside the expand button to avoid nested-interactive */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-semibold text-gray-900">{displayName(co.name)}</span>
          <Link
            href={`/scout/${co.slug}`}
            className="text-xs text-purple-700 hover:text-purple-900 transition-colors"
            aria-label={`View ${displayName(co.name)} ESG profile`}
          >
            Profile ↗
          </Link>
        </div>
        {/* Expand/collapse trigger — no nested interactive elements */}
        <div
          ref={triggerRef}
          className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-inset rounded-lg"
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-controls={`steward-card-${co.slug}`}
          aria-label={`${displayName(co.name)} engagement details`}
          onClick={() => { const wasExpanded = expanded; setExpanded(!expanded); if (wasExpanded) triggerRef.current?.focus(); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const wasExpanded = expanded; setExpanded(!expanded); if (wasExpanded) triggerRef.current?.focus(); } }}
        >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
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
              {!isPipeline && !expanded && (
                <span className="flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                  <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                  AI Action Plan
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{co.sector}</span>
              <span>·</span>
              <span>{co.country}</span>
              <span>·</span>
              <span>Last updated: {co.lastUpdated ? formatDate(co.lastUpdated) : "—"}</span>
            </div>
          </div>

          {/* Right side: scores + engagement counts */}
          <div className="flex items-center gap-6 ml-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <ESGMini label="E" value={co.esgScore.environmental} />
              <ESGMini label="S" value={co.esgScore.social} />
              <ESGMini label="G" value={co.esgScore.governance} />
            </div>
            <div role="img" className="flex flex-col items-center" aria-label={`${completionPct}% of planned engagements completed${overdueCount > 0 ? `, ${overdueCount} overdue` : ""}`}>
              <svg aria-hidden="true" width="44" height="44" className="-rotate-90">
                <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={5} />
                {ringTotal > 0 && <circle cx="22" cy="22" r={radius} fill="none"
                  stroke={overdueCount > 0 ? "#f97316" : "#10b981"}
                  strokeWidth={5}
                  strokeDasharray={`${filled} ${circ}`}
                  strokeLinecap="round" />}
              </svg>
              <span className="-mt-[34px] text-[10px] font-bold text-gray-700">{completionPct}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                <span className="text-gray-700"><span className="sr-only">Completed: </span>{completedCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                <span className="text-gray-700"><span className="sr-only">Planned: </span>{plannedCount}</span>
              </div>
              {overdueCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                  <span className="text-red-700 font-medium"><span className="sr-only">Overdue: </span>{overdueCount}</span>
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
        </div>{/* close expand/collapse role=button */}
      </div>{/* close p-5 outer div */}

      {/* Expanded Content — always in DOM so aria-controls target always resolves; toggle visibility with hidden */}
        <div id={`steward-card-${co.slug}`} hidden={!expanded} className="border-t border-gray-200 p-5 space-y-5">
          {/* Engagement Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Engagement History</h3>
            <div className="space-y-2">
              {[...co.engagement].sort((a, b) => {
                // Overdue first (action required), then Planned (upcoming), then Completed (history)
                const statusPriority = { Overdue: 0, Planned: 1, Completed: 2 };
                const sp = (statusPriority[a.status] ?? 2) - (statusPriority[b.status] ?? 2);
                if (sp !== 0) return sp;
                // Within same status: most recent first; null/undefined dates sort last
                const da = a.date || "", db = b.date || "";
                return da > db ? -1 : da < db ? 1 : 0;
              }).map((e) => (
                <div key={e.id ?? `${e.date}-${e.topic}-${e.status}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    e.status === "Completed" ? "bg-emerald-500" :
                    e.status === "Planned" ? "bg-blue-500" : "bg-red-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-gray-900">{e.topic}</span>
                      <span className="text-xs text-gray-600">{e.type}</span>
                      <span className="text-xs text-gray-600">{e.date ? formatDate(e.date) : "—"}</span>
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
          ) : <div aria-busy={planLoading}>
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
                title={plan && !planLoading ? "This will replace the existing action plan with a new Gemini call" : undefined}
                className="flex items-center gap-2 text-sm bg-[#4B2580] hover:bg-[#3D1A6E] disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                {planLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {planLoading ? "Generating..." : plan ? "Regenerate" : "Generate Plan"}
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
                    onClick={async () => { const ok = await copyToClipboard(plan); if (ok) { setPlanCopied(true); setTimeout(() => setPlanCopied(false), 2000); } }}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {planCopied ? "Copied!" : "Copy to clipboard"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const win = window.open("", "_blank", "width=800,height=600");
                      if (!win) { setPlanError("Popup blocked — allow popups for this site and try again."); return; }
                      const esc = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
                      win.document.write(`<!DOCTYPE html><html><head><title>ESG Action Plan — ${esc(co.name)}</title><style>
      body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; line-height: 1.7; color: #1a1a1a; }
      h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
      .meta { color: #666; font-size: 13px; margin-bottom: 24px; border-bottom: 1px solid #ddd; padding-bottom: 12px; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-left: 8px;
        background: ${["AAA","AA","A"].includes(co.esgScore.rating) ? "#d1fae5" : ["BBB","BB"].includes(co.esgScore.rating) ? "#fef3c7" : "#fee2e2"};
        color: ${["AAA","AA","A"].includes(co.esgScore.rating) ? "#065f46" : ["BBB","BB"].includes(co.esgScore.rating) ? "#92400e" : "#991b1b"}; }
      .content { white-space: pre-wrap; font-size: 14px; }
      @media print { body { margin: 20px; } }
    </style></head><body>
      <h1>${esc(co.name)}<span class="badge">${esc(co.esgScore.rating)}</span></h1>
      <div class="meta">${esc(co.sector)} · ${esc(co.country)} · ESG ${co.esgScore.overall}/100 · Generated ${new Date().toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}</div>
      <div class="content">${plan.replace(/&/g,"&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </body></html>`);
                      win.document.close();
                      win.print();
                    }}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors ml-4"
                    aria-label="Export action plan as PDF"
                  >
                    <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export PDF
                  </button>
                  <span className="text-xs text-gray-500 ml-auto">
                    {planGeneratedAt ? <RelativeTime date={planGeneratedAt} /> : ""}
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
    </div>
  );
});

function ESGMini({ label, value }: { label: string; value: number }) {
  const color =
    value >= 65 ? "text-emerald-700" : value >= 40 ? "text-amber-800" : value >= 25 ? "text-orange-700" : "text-red-600";
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
