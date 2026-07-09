"use client";
import { useState } from "react";
import { frameworks, caseStudies } from "@/data/learn";
import { PageHeader } from "@/components/ui-elements";
import { ExternalLink, ChevronRight, Search } from "lucide-react";

type FrameworkFilter = "All" | "Climate" | "Nature" | "Cross-cutting" | "Reporting" | "Social";

export default function LearnPage() {
  const [frameworkFilter, setFrameworkFilter] = useState<FrameworkFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const q = searchQuery.trim().toLowerCase();

  const filteredFrameworks = frameworks.filter((f) => {
    const matchesCategory = frameworkFilter === "All" || f.category === frameworkFilter;
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      f.fullName.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.aseanContext.toLowerCase().includes(q)
    );
  });

  // Map framework categories to related case study themes for cross-column filtering
  const categoryToThemes: Record<string, string[]> = {
    Climate: ["Climate Transition"],
    Nature: ["Nature & Biodiversity"],
    Social: ["Just Transition"],
    Reporting: ["Climate Transition", "Nature & Biodiversity", "Just Transition", "Governance", "Sustainable Finance"],
    "Cross-cutting": ["Climate Transition", "Nature & Biodiversity", "Just Transition", "Governance", "Sustainable Finance"],
  };
  const relevantThemes = frameworkFilter === "All" ? null : categoryToThemes[frameworkFilter] ?? null;

  const filteredCaseStudies = caseStudies.filter((cs) => {
    if (relevantThemes && !relevantThemes.includes(cs.theme)) return false;
    if (!q) return true;
    return (
      cs.title.toLowerCase().includes(q) ||
      cs.summary.toLowerCase().includes(q) ||
      cs.outcome.toLowerCase().includes(q) ||
      cs.lessonLearned.toLowerCase().includes(q)
    );
  });

  const highRelevance = filteredFrameworks.filter((f) => f.temasekRelevance === "High");
  const medRelevance = filteredFrameworks.filter((f) => f.temasekRelevance === "Medium");
  const deepDiveFrameworks = highRelevance; // high-relevance frameworks that also match search/filter

  const filterCategories: FrameworkFilter[] = ["All", "Climate", "Nature", "Reporting", "Cross-cutting", "Social"];

  return (
    <div className="p-8">
      <PageHeader
        title="Knowledge Repository"
        subtitle="ESG frameworks, guidelines, and case studies — Temasek's sustainability knowledge base for the Investment Group."
      />

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search ESG frameworks and case studies"
          placeholder="Search frameworks and case studies..."
          className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-700 text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-600/40 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tabs — static, SSR-friendly */}
      <div className="grid grid-cols-2 gap-8">
        {/* Left column: Frameworks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">ESG Frameworks & Standards</h2>
            <span className="text-xs text-gray-500">{filteredFrameworks.length} of {frameworks.length}</span>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {filterCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFrameworkFilter(cat)}
                aria-pressed={frameworkFilter === cat}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  frameworkFilter === cat
                    ? "bg-[#4B2580]/15 text-purple-700 border-purple-500/40"
                    : "text-gray-600 border-gray-200 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredFrameworks.length === 0 && (
            <p className="text-xs text-gray-500 py-4">No frameworks in this category or search.</p>
          )}

          {highRelevance.length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium pb-2">High Relevance to Temasek Portfolio</div>
            <div className="space-y-2">
              {highRelevance.map((f) => <FrameworkRow key={f.id} framework={f} />)}
            </div>
          </div>
          )}

          {medRelevance.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium pb-2 pt-2">Reference</div>
              <div className="space-y-2">
                {medRelevance.map((f) => <FrameworkRow key={f.id} framework={f} />)}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Case Studies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">ESG Case Studies</h2>
            <span className="text-xs text-gray-500">{filteredCaseStudies.length} of {caseStudies.length}</span>
          </div>
          {filteredCaseStudies.length === 0 && (
            <p className="text-xs text-gray-500 py-4">No case studies match your search.</p>
          )}
          <div className="space-y-3">
            {filteredCaseStudies.map((cs) => <CaseStudyCard key={cs.id} study={cs} />)}
          </div>
        </div>
      </div>

      {/* Framework Detail Cards */}
      {deepDiveFrameworks.length > 0 && (
      <div className="mt-10">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Framework Deep Dives</h2>
        <div className="grid grid-cols-2 gap-4">
          {deepDiveFrameworks.map((f) => (
            <FrameworkDetailCard key={f.id} framework={f} />
          ))}
        </div>
      </div>
      )}
    </div>
  );
}

function FrameworkRow({ framework: f }: { framework: (typeof frameworks)[0] }) {
  const categoryColors: Record<string, string> = {
    Climate: "text-emerald-400",
    Nature: "text-green-400",
    "Cross-cutting": "text-purple-400",
    Reporting: "text-amber-400",
    Social: "text-blue-400",
  };
  const statusStyles: Record<string, string> = {
    Mandatory: "text-red-400 bg-red-500/10 border-red-500/20",
    Voluntary: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    Emerging: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-200 transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-base font-bold ${categoryColors[f.category] ?? "text-gray-600"} bg-gray-100`}>
        {f.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-gray-900 truncate">{f.name}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${statusStyles[f.status] ?? "text-gray-600 bg-gray-100 border-gray-200"}`}>{f.status}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${categoryColors[f.category] ?? "text-gray-600"}`}>{f.category}</span>
          <span className="text-xs text-gray-500">·</span>
          <span className="text-xs text-gray-500 truncate">{f.fullName}</span>
        </div>
      </div>
      <a
        href={f.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${f.name} website`}
        className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function CaseStudyCard({ study: cs }: { study: (typeof caseStudies)[0] }) {
  const themeColors: Record<string, string> = {
    "Climate Transition": "text-emerald-400 bg-emerald-500/10",
    "Nature & Biodiversity": "text-green-400 bg-green-500/10",
    "Just Transition": "text-orange-400 bg-orange-500/10",
    "Governance": "text-purple-400 bg-purple-500/10",
    "Sustainable Finance": "text-blue-400 bg-blue-500/10",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${themeColors[cs.theme] ?? "text-gray-600 bg-gray-200"}`}>{cs.theme}</span>
        <span className="text-xs text-gray-500">{cs.year}</span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">{cs.title}</h3>
      <div className="text-xs text-gray-500 mb-2">{cs.company} · {cs.sector} · {cs.region}</div>
      <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-3">{cs.summary}</p>
      <div className="bg-emerald-600/5 border border-emerald-600/15 rounded-lg p-2.5 mb-2">
        <div className="text-xs text-emerald-400 font-medium mb-0.5">Key Outcome</div>
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{cs.outcome}</p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
        <div className="text-xs text-gray-600 font-medium mb-0.5">Lesson Learned</div>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{cs.lessonLearned}</p>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {cs.frameworks.map((fw) => (
          <span key={fw} className="text-xs text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">{fw}</span>
        ))}
      </div>
    </div>
  );
}

function FrameworkDetailCard({ framework: f }: { framework: (typeof frameworks)[0] }) {
  const categoryColors: Record<string, string> = {
    Climate: "border-emerald-600/20 bg-emerald-600/5",
    Nature: "border-green-600/20 bg-green-600/5",
    "Cross-cutting": "border-purple-600/20 bg-purple-600/5",
    Reporting: "border-amber-500/20 bg-amber-500/5",
    Social: "border-blue-600/20 bg-blue-600/5",
  };

  return (
    <div className={`rounded-xl border p-5 ${categoryColors[f.category] ?? "border-gray-200 bg-gray-50"}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold text-gray-900">{f.name}</span>
            <span className="text-xs text-gray-500">{f.adoptionYear}</span>
          </div>
          <p className="text-xs text-gray-600">{f.fullName}</p>
        </div>
        <a
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${f.name} website`}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <p className="text-xs text-gray-700 leading-relaxed mb-3">{f.description}</p>

      <div className="mb-3">
        <div className="text-xs text-gray-500 font-medium mb-1.5">Key Requirements</div>
        <ul className="space-y-1">
          {f.keyRequirements.map((req) => (
            <li key={req} className="flex items-start gap-2 text-xs text-gray-600">
              <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-500" />
              {req}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-600 font-medium mb-1">Investment Relevance</div>
        <p className="text-xs text-gray-600 leading-relaxed">{f.investmentRelevance}</p>
      </div>

      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-500 font-medium mb-1">ASEAN Context</div>
        <p className="text-xs text-gray-500 leading-relaxed">{f.aseanContext}</p>
      </div>
    </div>
  );
}
