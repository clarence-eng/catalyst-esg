"use client";
import { useState } from "react";
import Link from "next/link";
import { megatrends, regulatoryUpdates } from "@/data/megatrends";
import { companies } from "@/data/companies";
import { PageHeader } from "@/components/ui-elements";
import { ArrowRight, AlertCircle } from "lucide-react";

const companyNameMap = Object.fromEntries(companies.map((c) => [c.slug, c.name]));
// Active companies only — must match Portfolio Exposure Matrix which also filters to Active
const activePortfolioSlugs = new Set(companies.filter(c => c.portfolioStatus === "Active").map(c => c.slug));
const pipelinePortfolioSlugs = new Set(companies.filter(c => c.portfolioStatus === "Pipeline").map(c => c.slug));

const allJurisdictions = ["All", ...new Set(regulatoryUpdates.map((r) => {
  const j = r.jurisdiction.split(" /")[0].trim();
  return j.startsWith("Global") ? "Global" : j;
}))];
const allCategories = ["All", ...new Set(regulatoryUpdates.map((r) => r.category))];

const megatrendColorMap: Record<string, string> = {
  emerald: "border-emerald-600/20 hover:border-emerald-500/40",
  green: "border-green-600/20 hover:border-green-500/40",
  orange: "border-orange-500/20 hover:border-orange-400/40",
  blue: "border-blue-500/20 hover:border-blue-400/40",
  purple: "border-purple-500/20 hover:border-purple-400/40",
};
const megatrendTextMap: Record<string, string> = {
  emerald: "text-emerald-700",
  green: "text-green-700",
  orange: "text-orange-600",
  blue: "text-blue-700",
  purple: "text-purple-700",
};
const megatrendUrgencyMap: Record<string, string> = {
  Immediate: "text-red-700 bg-red-100",
  "Near-term": "text-amber-700 bg-amber-100",
  "Long-term": "text-blue-700 bg-blue-100",
};

export default function SignalPage() {
  const [jurisdictionFilter, setJurisdictionFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filteredUpdates = regulatoryUpdates.filter((r) => {
    const primaryJurisdiction = r.jurisdiction.split(" /")[0].trim();
    const matchJ = jurisdictionFilter === "All" ||
      (jurisdictionFilter === "Global"
        ? primaryJurisdiction.startsWith("Global")
        : primaryJurisdiction === jurisdictionFilter);
    const matchC = categoryFilter === "All" || r.category === categoryFilter;
    return matchJ && matchC;
  });

  const highUrgency = filteredUpdates.filter((r) => r.urgency === "High");
  const mediumUrgency = filteredUpdates.filter((r) => r.urgency === "Medium");
  const lowUrgency = filteredUpdates.filter((r) => r.urgency === "Low");

  return (
    <div className="p-8">
      <PageHeader
        title="Signal"
        subtitle="ESG megatrend intelligence and regulatory radar — thematic research for investment decisions and portfolio management."
      />

      {/* Megatrend Cards */}
      <h2 className="text-sm font-semibold text-gray-900 mb-4">ESG Megatrends</h2>
      <div className="grid grid-cols-3 gap-4 mb-10">
        {megatrends.map((t) => {
          const exposureSummary = t.portfolioExposure.filter((p) => p.exposure === "High" && activePortfolioSlugs.has(p.slug)).length;

          return (
            <Link
              key={t.slug}
              href={`/signal/${t.slug}`}
              className={`bg-white rounded-xl border p-5 hover:bg-gray-50 transition-all group ${megatrendColorMap[t.color] ?? "border-gray-200"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${megatrendUrgencyMap[t.urgency] ?? "text-gray-600 bg-gray-200"}`}>
                  {t.urgency}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-gray-600 transition-colors" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{t.title}</h3>
              <p className="text-xs text-gray-600 mb-3">{t.subtitle}</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3">{t.summary}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {exposureSummary > 0
                    ? <><span className="text-gray-700">{exposureSummary}</span> high-exposure active cos</>
                    : <span className="text-gray-500">No high-exposure active cos</span>
                  }
                </div>
                <div className={`text-xs ${megatrendTextMap[t.color] ?? "text-gray-600"}`}>{t.temasekAlignment}</div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {t.frameworks.slice(0, 3).map((f) => (
                  <span key={f} className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                    {f}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Regulatory Compliance Timeline */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Compliance Deadline Calendar</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {[...filteredUpdates]
            .sort((a, b) => {
              const urgencyOrder = { High: 0, Medium: 1, Low: 2 };
              return (urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 3) - (urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 3);
            })
            .map((r, i) => (
              <div key={r.id} className={`flex items-start gap-4 px-5 py-3 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"} border-b border-gray-100 last:border-0`}>
                <div className="w-28 flex-shrink-0">
                  <div className={`text-xs font-semibold px-2 py-1 rounded text-center ${
                    r.status === "In Force" ? "text-emerald-700 bg-emerald-50 border border-emerald-300" :
                    r.status === "Effective 2026" ? "text-blue-700 bg-blue-50 border border-blue-300" :
                    "text-gray-600 bg-gray-100 border border-gray-300"
                  }`}>{r.effectiveDate}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{r.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      r.urgency === "High" ? "text-red-700 bg-red-100" :
                      r.urgency === "Medium" ? "text-amber-700 bg-amber-100" :
                      "text-blue-700 bg-blue-100"
                    }`}>{r.urgency}</span>
                  </div>
                  <div className="text-xs text-gray-600">{r.jurisdiction} · {r.category}</div>
                </div>
                <div className="flex-shrink-0 text-xs text-gray-600">
                  {r.portfolioImpact?.length ? `${r.portfolioImpact.length} co${r.portfolioImpact.length > 1 ? "s" : ""}` : ""}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Portfolio Exposure Matrix */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Portfolio Exposure Matrix</h2>
        <p className="text-xs text-gray-500 mb-4">High/Medium exposure by active portfolio company × megatrend · Pipeline companies excluded</p>
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th scope="col" className="text-left px-4 py-3 text-gray-600 font-medium w-36">Company</th>
                {megatrends.map(t => (
                  <th key={t.slug} scope="col" className="text-center px-2 py-3 text-gray-600 font-medium w-28">{t.title.split(" ")[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.filter(c => c.portfolioStatus === "Active").map(co => (
                <tr key={co.slug} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/scout/${co.slug}`} className="text-gray-900 font-medium hover:text-purple-700">{co.name}</Link>
                  </td>
                  {megatrends.map(t => {
                    const exposure = t.portfolioExposure.find(p => p.slug === co.slug);
                    return (
                      <td key={t.slug} className="text-center px-2 py-2.5">
                        {exposure ? (
                          <span className={`inline-block w-16 text-center py-0.5 rounded text-xs font-medium border ${
                            exposure.exposure === "High" ? "text-red-700 bg-red-50 border-red-300" :
                            exposure.exposure === "Medium" ? "text-amber-700 bg-amber-50 border-amber-300" :
                            "text-emerald-700 bg-emerald-50 border-emerald-300"
                          }`}>{exposure.exposure}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regulatory Radar */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Regulatory Radar</h2>
        <span className="text-xs text-gray-500">{filteredUpdates.length} of {regulatoryUpdates.length} regulations</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500">Jurisdiction:</span>
          {allJurisdictions.map((j) => (
            <button
              type="button"
              key={j}
              onClick={() => setJurisdictionFilter(j)}
              aria-pressed={jurisdictionFilter === j}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                jurisdictionFilter === j
                  ? "bg-purple-700/15 text-purple-700 border-purple-500/40"
                  : "text-gray-600 border-gray-200 hover:text-gray-800"
              }`}
            >
              {j}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500">Category:</span>
          {allCategories.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategoryFilter(c)}
              aria-pressed={categoryFilter === c}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                categoryFilter === c
                  ? "bg-purple-700/15 text-purple-700 border-purple-500/40"
                  : "text-gray-600 border-gray-200 hover:text-gray-800"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {highUrgency.length > 0 && (
          <>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium pb-1">High Priority</div>
            {highUrgency.map((r) => <RegUpdateCard key={r.id} update={r} />)}
          </>
        )}
        {mediumUrgency.length > 0 && (
          <>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium pb-1 pt-4">Monitor</div>
            {mediumUrgency.map((r) => <RegUpdateCard key={r.id} update={r} />)}
          </>
        )}
        {lowUrgency.length > 0 && (
          <>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium pb-1 pt-4">Policy Tailwinds</div>
            {lowUrgency.map((r) => <RegUpdateCard key={r.id} update={r} />)}
          </>
        )}
        {filteredUpdates.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-8 border border-dashed border-gray-200 rounded-lg">
            No regulations match the selected filters
          </div>
        )}
      </div>
    </div>
  );
}

function RegUpdateCard({ update: r }: { update: (typeof regulatoryUpdates)[0] }) {
  const statusColors: Record<string, string> = {
    "In Force": "text-emerald-700 bg-emerald-50 border-emerald-300",
    "Effective 2026": "text-blue-700 bg-blue-50 border-blue-300",
    Proposed: "text-gray-600 bg-gray-100 border-gray-200",
    Consultation: "text-gray-600 bg-gray-100 border-gray-200",
  };
  const categoryColors: Record<string, string> = {
    "Climate Disclosure": "text-emerald-700",
    Nature: "text-green-700",
    Social: "text-blue-700",
    Governance: "text-purple-700",
    Taxonomy: "text-teal-700",
    "Carbon Pricing": "text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-4">
        <div className="w-4 h-4 mt-0.5 flex-shrink-0">
          {r.urgency === "High" && <AlertCircle className="w-4 h-4 text-amber-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap mb-1.5">
            <span className="text-sm font-medium text-gray-900">{r.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[r.status] ?? "text-gray-600 bg-gray-100 border-gray-200"}`}>{r.status}</span>
            <span className={`text-xs font-medium ${categoryColors[r.category] ?? "text-gray-600"}`}>{r.category}</span>
            {r.portfolioImpact && r.portfolioImpact.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                r.portfolioImpact.length <= 2
                  ? "text-amber-700 bg-amber-50 border-amber-300"
                  : "text-orange-700 bg-orange-50 border-orange-300"
              }`}>
                Affects {r.portfolioImpact.length} {r.portfolioImpact.length === 1 ? "company" : "companies"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <span>{r.jurisdiction}</span>
            <span>·</span>
            <span>Effective: {r.effectiveDate}</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed mb-2">{r.summary}</p>
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2.5">
            <span className="text-gray-600 font-medium">Investment Impact: </span>
            {r.investmentImpact}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {r.relevantSectors.map((s) => (
              <span key={s} className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
          {r.portfolioImpact && r.portfolioImpact.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-gray-500">Portfolio:</span>
              {r.portfolioImpact.map((slug) => (
                <Link
                  key={slug}
                  href={`/scout/${slug}`}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${
                    pipelinePortfolioSlugs.has(slug)
                      ? "text-blue-700 bg-blue-50 border border-blue-300 hover:bg-blue-100"
                      : "text-purple-700 bg-purple-50 border border-purple-300 hover:bg-purple-100"
                  }`}
                >
                  {companyNameMap[slug] ?? slug}{pipelinePortfolioSlugs.has(slug) ? " ·Pipeline" : ""}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
