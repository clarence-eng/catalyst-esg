"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompanies } from "@/lib/useCompanies";
import { RatingBadge, MaturityBadge, PageHeader, RiskBadge } from "@/components/ui-elements";
import { Search, ArrowRight, GitMerge } from "lucide-react";
import { ComparisonDrawer } from "@/components/ComparisonDrawer";

type StatusFilter = "All" | "Active" | "Pipeline";
type SortKey = "esg_desc" | "esg_asc" | "carbon_asc" | "carbon_desc" | "name_asc";

const MEGATREND_COLORS: Record<string, string> = {
  "Climate Transition": "text-emerald-700",
  "Nature & Biodiversity": "text-green-700",
  "Just Transition & Inclusive Growth": "text-orange-700",
  "AI & Digital Ethics": "text-blue-700",
  "Longer Lifespans": "text-indigo-700",
};

const MEGATREND_SLUGS: Record<string, string> = {
  "Climate Transition": "climate-transition",
  "Nature & Biodiversity": "nature-biodiversity",
  "Just Transition & Inclusive Growth": "just-transition",
  "AI & Digital Ethics": "ai-digital-ethics",
  "Longer Lifespans": "longer-lifespans",
};

const COMPARE_KEY = "catalyst_compare_set";
const FILTER_KEY = "catalyst_scout_filter";

function loadCompareSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = sessionStorage.getItem(COMPARE_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) { sessionStorage.removeItem(COMPARE_KEY); return new Set(); }
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch { return new Set(); }
}

const VALID_STATUS: StatusFilter[] = ["All", "Active", "Pipeline"];

function loadFilter(): { query: string; statusFilter: StatusFilter } {
  const defaults = { query: "", statusFilter: "All" as StatusFilter };
  if (typeof window === "undefined") return defaults;
  try {
    const stored = sessionStorage.getItem(FILTER_KEY);
    if (!stored) return defaults;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return defaults;
    const q = typeof parsed.query === "string" ? parsed.query : "";
    const sf = VALID_STATUS.includes(parsed.statusFilter) ? parsed.statusFilter as StatusFilter : "All";
    return { query: q, statusFilter: sf };
  } catch { return defaults; }
}

export default function ScoutPage() {
  const router = useRouter();
  const { companies, liveDataError, showDemoBanner } = useCompanies();
  // Start with SSR-safe defaults to avoid hydration mismatch
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("esg_desc");
  // Track whether initial restore from sessionStorage has completed
  const restoredRef = useRef(false);
  // renderCountRef: persist effects only write after at least 2 renders (restore fires on render 1, restored values apply on render 2)
  const renderCountRef = useRef(0);

  // Restore from sessionStorage after hydration (client only)
  useEffect(() => {
    const { query: q, statusFilter: sf } = loadFilter();
    const cs = loadCompareSet();
    setQuery(q);
    setStatusFilter(sf);
    setCompareSet(cs);
    restoredRef.current = true;
  }, []);

  // Persist comparison state — only after initial restore values have rendered
  useEffect(() => {
    renderCountRef.current += 1;
    if (!restoredRef.current || renderCountRef.current <= 1) return;
    try { sessionStorage.setItem(COMPARE_KEY, JSON.stringify([...compareSet])); } catch { /* quota exceeded */ }
  }, [compareSet]);

  // Persist filter state — only after initial restore values have rendered
  useEffect(() => {
    if (!restoredRef.current || renderCountRef.current <= 1) return;
    try { sessionStorage.setItem(FILTER_KEY, JSON.stringify({ query, statusFilter })); } catch { /* quota exceeded */ }
  }, [query, statusFilter]);


  const ACTIVE_COUNT = companies.filter((c) => c.portfolioStatus === "Active").length;
  const PIPELINE_COUNT = companies.filter((c) => c.portfolioStatus === "Pipeline").length;

  const filtered = companies.filter((c) => {
    const matchesStatus = statusFilter === "All" || c.portfolioStatus === statusFilter;
    if (!matchesStatus) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.sasbCategory.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.temasekMegatrend.toLowerCase().includes(q)
    );
  }).slice().sort((a, b) => {
    if (sortKey === "esg_desc") return b.esgScore.overall - a.esgScore.overall;
    if (sortKey === "esg_asc") return a.esgScore.overall - b.esgScore.overall;
    if (sortKey === "carbon_asc") return a.carbonIntensity - b.carbonIntensity;
    if (sortKey === "carbon_desc") return b.carbonIntensity - a.carbonIntensity;
    if (sortKey === "name_asc") return a.name.localeCompare(b.name, "en-SG");
    return 0;
  });

  return (
    <div className="p-8">
      {showDemoBanner && (
        <div role="status" aria-live="polite" className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
          <span aria-hidden="true">⚠</span>
          <span>Using demo data — live portfolio database unavailable. Company data may not reflect the current portfolio.</span>
        </div>
      )}
      <PageHeader
        title="Scout"
        subtitle="ESG due diligence for new investment opportunities and portfolio monitoring. Risk management and value uplift lens."
      >
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">{ACTIVE_COUNT} Active</span>
          <span className="bg-blue-50 border border-blue-300 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
            <GitMerge className="w-3 h-3" />{PIPELINE_COUNT} Pipeline
          </span>
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div role="group" aria-label="Filter by portfolio status" className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {(["All", "Active", "Pipeline"] as StatusFilter[]).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors font-medium ${
                statusFilter === s
                  ? s === "Pipeline"
                    ? "bg-blue-50 text-blue-700 border border-blue-300"
                    : "bg-[#4B2580]/15 text-purple-700 border border-purple-500/40"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="scout-sort">Sort by</label>
        <select
          id="scout-sort"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-600/40"
        >
          <option value="esg_desc">ESG Score ↓ (best first)</option>
          <option value="esg_asc">ESG Score ↑ (triage)</option>
          <option value="carbon_asc">Carbon ↑ (lowest first)</option>
          <option value="carbon_desc">Carbon ↓ (highest first)</option>
          <option value="name_asc">Name A–Z</option>
        </select>
        <div className="text-xs text-gray-500" role="status" aria-live="polite" aria-atomic="true">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search portfolio companies"
          placeholder="Search by name, sector, country, SASB category, or description..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-700 text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-600/40 focus:ring-2 focus:ring-purple-400/40 transition-colors"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700">
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-sm mb-3">No companies match your filters</div>
          {(query || statusFilter !== "All") && (
            <button
              type="button"
              onClick={() => { setQuery(""); setStatusFilter("All"); }}
              className="text-xs text-purple-700 border border-purple-200 bg-purple-50 hover:bg-purple-100 px-4 py-1.5 rounded-full transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Company Cards */}
      <div className={`grid grid-cols-1 gap-4 ${compareSet.size > 0 ? "pb-44" : ""}`}>
        {filtered.map((co) => (
          <Link
            key={co.slug}
            href={`/scout/${co.slug}`}
            className={`bg-white border rounded-xl p-5 transition-all group ${
              co.portfolioStatus === "Pipeline"
                ? "border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-600/5"
                : "border-gray-200 hover:border-purple-600/30 hover:bg-purple-600/5"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-gray-900">{co.name}</span>
                  {co.portfolioStatus === "Pipeline" && (
                    <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded-full font-medium">
                      <GitMerge className="w-2.5 h-2.5" /> Under Evaluation
                    </span>
                  )}
                  <RatingBadge rating={co.esgScore.rating} />
                  <MaturityBadge level={co.maturity} />
                  {(() => {
                    const scores = [...co.historicalScores].sort((a, b) => {
                      const [aq, ay] = (a.period.match(/Q(\d) (\d{4})/) || ["","0","0"]).slice(1).map(Number);
                      const [bq, by] = (b.period.match(/Q(\d) (\d{4})/) || ["","0","0"]).slice(1).map(Number);
                      return ay !== by ? ay - by : aq - bq;
                    });
                    const last = scores[scores.length - 1];
                    const prev = scores[scores.length - 2];
                    if (last && prev) {
                      const lastAvg = (last.e + last.s + last.g) / 3;
                      const prevAvg = (prev.e + prev.s + prev.g) / 3;
                      const delta = Math.round(lastAvg - prevAvg);
                      if (delta > 0) {
                        return (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                            ↑ +{delta}
                          </span>
                        );
                      } else if (delta < 0) {
                        return (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-300">
                            ↓ {delta}
                          </span>
                        );
                      } else {
                        return (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-300">
                            → 0
                          </span>
                        );
                      }
                    }
                    return null;
                  })()}
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{co.country}</span>
                </div>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed max-w-3xl">{co.description}</p>
                {(() => {
                  const overdueEngs = co.engagement.filter(e => e.status === "Overdue");
                  if (!overdueEngs.length) return null;
                  const shownTopics = overdueEngs.slice(0, 2).map(e => e.topic).join(", ");
                  const more = overdueEngs.length - 2;
                  return (
                    <div className="flex items-center gap-2 mb-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
                      <span className="text-orange-600 text-xs" aria-hidden="true">⚠</span>
                      <span className="text-xs text-orange-700 font-medium">
                        {overdueEngs.length} overdue engagement{overdueEngs.length > 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-orange-600 ml-1">
                        — {shownTopics}{more > 0 ? ` +${more} more` : ""}
                      </span>
                    </div>
                  );
                })()}
                <div className="flex items-center gap-6">
                  <div className="text-xs text-gray-500">
                    <span className="text-gray-700">{co.sasbCategory}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Megatrend: <button
                      type="button"
                      aria-label={`View ${co.temasekMegatrend} megatrend signal`}
                      className={`text-xs ${MEGATREND_COLORS[co.temasekMegatrend] ?? "text-gray-600"} hover:underline`}
                      onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/signal/${MEGATREND_SLUGS[co.temasekMegatrend] ?? "climate-transition"}`); }}
                    >
                      {co.temasekMegatrend}
                    </button>
                  </div>
                  {/* Green Revenue bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Green Rev:</span>
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          co.greenRevenuePct >= 30 ? "bg-emerald-500" : co.greenRevenuePct >= 10 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(co.greenRevenuePct, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      co.greenRevenuePct >= 30 ? "text-emerald-700" : co.greenRevenuePct >= 10 ? "text-amber-700" : "text-red-700"
                    }`}>{co.greenRevenuePct}%</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Carbon Intensity: <span className="text-gray-700">{co.carbonIntensity} tCO₂e/$M</span>
                  </div>
                  {(() => {
                    const lastEng = co.engagement.filter(e => e.status === "Completed").sort((a,b) => b.date.localeCompare(a.date))[0];
                    // Parse as local midnight (date-only ISO strings are UTC by default — causes 8h skew in SGT)
                    const daysSince = lastEng ? (() => {
                      const parts = lastEng.date.split("-").map(Number);
                      if (parts.length !== 3 || parts.some(isNaN)) return null;
                      const [y,m,d] = parts;
                      return Math.floor((Date.now() - new Date(y, m-1, d).getTime()) / (1000*60*60*24));
                    })() : null;
                    if (daysSince === null) return null;
                    return (
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${
                        daysSince < 90 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                        daysSince < 180 ? "text-amber-700 bg-amber-50 border-amber-200" :
                        "text-red-700 bg-red-50 border-red-200"
                      }`} title={`Last completed engagement: ${lastEng?.date}`}>
                        Last engaged: {daysSince < 30 ? `${daysSince}d ago` : daysSince < 365 ? `${Math.floor(daysSince/30)}mo ago` : `${Math.floor(daysSince/365)}y ago`}
                      </span>
                    );
                  })()}
                </div>
                {co.sdgAlignment.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2.5">
                    {co.sdgAlignment.map(({ sdg, label }, i) => (
                      <SDGBadge key={`${sdg}-${i}`} sdg={sdg} label={label} />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6 ml-6 flex-shrink-0">
                {(() => {
                  const score = co.esgScore.overall;
                  const ringClass = score >= 65
                    ? "border-emerald-500 bg-emerald-50"
                    : score >= 40
                    ? "border-amber-500 bg-amber-50"
                    : "border-red-500 bg-red-50";
                  const textClass = score >= 65
                    ? "text-emerald-700"
                    : score >= 40
                    ? "text-amber-700"
                    : "text-red-700";
                  return (
                    <div
                      className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 flex-shrink-0 ${ringClass}`}
                      aria-label={`ESG score ${score}: Environmental ${co.esgScore.environmental}, Social ${co.esgScore.social}, Governance ${co.esgScore.governance}`}
                      role="img"
                    >
                      <span className={`text-lg font-bold leading-none ${textClass}`}>{score}</span>
                      <span className="text-[8px] text-gray-500 leading-none mt-0.5">ESG</span>
                    </div>
                  );
                })()}
                <ESGScoreSet e={co.esgScore.environmental} s={co.esgScore.social} g={co.esgScore.governance} />
                {(() => {
                  const scores = [...co.historicalScores].sort((a, b) => {
                    const [aq, ay] = (a.period.match(/Q(\d) (\d{4})/) || ["","0","0"]).slice(1).map(Number);
                    const [bq, by] = (b.period.match(/Q(\d) (\d{4})/) || ["","0","0"]).slice(1).map(Number);
                    return ay !== by ? ay - by : aq - bq;
                  }).slice(-6);
                  if (scores.length < 2) return null;
                  const avgs = scores.map(s => (s.e + s.s + s.g) / 3);
                  const min = Math.min(...avgs); const max = Math.max(...avgs);
                  const range = Math.max(max - min, 1);
                  const W = 48; const H = 20;
                  const pts = avgs.map((v, i) => `${(i / (avgs.length - 1)) * W},${H - ((v - min) / range) * H}`).join(" ");
                  const trend = avgs[avgs.length - 1] > avgs[0] ? "up" : avgs[avgs.length - 1] < avgs[0] ? "down" : "flat";
                  const strokeColor = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#94a3b8";
                  return (
                    <div className="flex-shrink-0" aria-label={`6-period ESG trend (${trend}): ${avgs.map(v => v.toFixed(1)).join(" → ")}`} role="img">
                      <svg width={W} height={H} className="overflow-visible" aria-hidden="true">
                        <polyline points={pts} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx={(avgs.length - 1) / (avgs.length - 1) * W} cy={H - ((avgs[avgs.length-1] - min) / range) * H} r={2.5} fill={strokeColor} />
                      </svg>
                    </div>
                  );
                })()}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20">Physical Risk</span>
                    <RiskBadge level={co.climateRisk.physical} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20">Transition Risk</span>
                    <RiskBadge level={co.climateRisk.transition} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20">Nature Risk</span>
                    <RiskBadge level={co.natureRisk.overall} />
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={compareSet.has(co.slug) ? `Remove ${co.name} from comparison` : compareSet.size >= 3 ? `Max 3 companies selected — ${co.name}` : `Add ${co.name} to comparison`}
                  aria-disabled={!compareSet.has(co.slug) && compareSet.size >= 3}
                  title={!compareSet.has(co.slug) && compareSet.size >= 3 ? "Maximum 3 companies can be compared" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCompareSet(prev => {
                      const next = new Set(prev);
                      if (next.has(co.slug)) next.delete(co.slug);
                      else if (next.size < 3) next.add(co.slug);
                      return next;
                    });
                  }}
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    compareSet.has(co.slug) ? "bg-purple-600 border-purple-600 text-white" :
                    compareSet.size >= 3 ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-40" :
                    "border-gray-300 hover:border-purple-400"
                  }`}
                >
                  {compareSet.has(co.slug) && <span className="text-[10px] font-bold">✓</span>}
                </button>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-600 transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>
      <ComparisonDrawer
        companies={companies.filter(c => compareSet.has(c.slug))}
        onRemove={(slug) => setCompareSet(prev => { const next = new Set(prev); next.delete(slug); return next; })}
        onClear={() => setCompareSet(new Set())}
      />
    </div>
  );
}

function ESGScoreSet({ e, s, g }: { e: number; s: number; g: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      {[{ label: "E", val: e }, { label: "S", val: s }, { label: "G", val: g }].map(({ label, val }) => {
        const color =
          val >= 65 ? "bg-emerald-500" : val >= 40 ? "bg-amber-500" : val >= 25 ? "bg-orange-500" : "bg-red-500";
        return (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-3">{label}</span>
            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${val}%` }} />
            </div>
            <span className="text-xs text-gray-600 w-6">{val}</span>
          </div>
        );
      })}
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
  // Light-colored SDG backgrounds need dark text for WCAG contrast
  const darkTextSdgs = new Set([2, 7, 9, 15]);
  const bg = sdgColors[sdg] ?? "bg-slate-600";
  const textClass = darkTextSdgs.has(sdg) ? "text-gray-900" : "text-white";
  return (
    <div className={`flex items-center gap-1 ${bg} rounded px-1.5 py-0.5`} title={`SDG ${sdg}: ${label}`}>
      <span className={`${textClass} text-[10px] font-bold leading-none`}>{sdg}</span>
      <span className={`${textClass} text-[9px] leading-none opacity-90 hidden sm:inline`}>{label}</span>
    </div>
  );
}
