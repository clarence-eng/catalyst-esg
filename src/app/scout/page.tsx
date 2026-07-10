"use client";
import { useState } from "react";
import Link from "next/link";
import { companies } from "@/data/companies";
import { RatingBadge, MaturityBadge, PageHeader, RiskBadge } from "@/components/ui-elements";
import { Search, ArrowRight, GitMerge } from "lucide-react";

type StatusFilter = "All" | "Active" | "Pipeline";

const MEGATREND_COLORS: Record<string, string> = {
  "Climate Transition": "text-emerald-700",
  "Nature & Biodiversity": "text-green-700",
  "Just Transition & Inclusive Growth": "text-orange-600",
  "AI & Digital Ethics": "text-blue-700",
  "Longer Lifespans": "text-indigo-700",
};

const ACTIVE_COUNT = companies.filter((c) => c.portfolioStatus === "Active").length;
const PIPELINE_COUNT = companies.filter((c) => c.portfolioStatus === "Pipeline").length;

export default function ScoutPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

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
  });

  return (
    <div className="p-8">
      <PageHeader
        title="Scout"
        subtitle="ESG due diligence for new investment opportunities and portfolio monitoring. Risk management and value uplift lens."
      >
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">{ACTIVE_COUNT} Active</span>
          <span className="bg-blue-500/10 border border-blue-500/20 text-blue-700 bg-blue-50 border-blue-300 px-2.5 py-1 rounded-full flex items-center gap-1">
            <GitMerge className="w-3 h-3" />{PIPELINE_COUNT} Pipeline
          </span>
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {(["All", "Active", "Pipeline"] as StatusFilter[]).map((s) => (
            <button
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
        <div className="text-xs text-gray-500">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>
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
          className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-700 text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-600/40 transition-colors"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700">
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">No companies match your filters</div>
      )}

      {/* Company Cards */}
      <div className="grid grid-cols-1 gap-4">
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
                      const [aq, ay] = (a.period.match(/Q(\d) (\d{4})/) || ["","0","9999"]).slice(1).map(Number);
                      const [bq, by] = (b.period.match(/Q(\d) (\d{4})/) || ["","0","9999"]).slice(1).map(Number);
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
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{co.country}</span>
                </div>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed max-w-3xl">{co.description}</p>
                <div className="flex items-center gap-6">
                  <div className="text-xs text-gray-500">
                    <span className="text-gray-700">{co.sasbCategory}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Megatrend: <span className={MEGATREND_COLORS[co.temasekMegatrend] ?? "text-gray-600"}>{co.temasekMegatrend}</span>
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
                <ESGScoreSet e={co.esgScore.environmental} s={co.esgScore.social} g={co.esgScore.governance} />
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
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-600 transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ESGScoreSet({ e, s, g }: { e: number; s: number; g: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      {[{ label: "E", val: e }, { label: "S", val: s }, { label: "G", val: g }].map(({ label, val }) => {
        const color =
          val >= 70 ? "bg-emerald-500" : val >= 50 ? "bg-amber-500" : val >= 35 ? "bg-orange-500" : "bg-red-500";
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
  const bg = sdgColors[sdg] ?? "bg-slate-600";
  return (
    <div className={`flex items-center gap-1 ${bg} rounded px-1.5 py-0.5`} title={`SDG ${sdg}: ${label}`}>
      <span className="text-white text-[10px] font-bold leading-none">{sdg}</span>
      <span className="text-white text-[9px] leading-none opacity-90 hidden sm:inline">{label}</span>
    </div>
  );
}
