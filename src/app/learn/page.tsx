"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { frameworks, caseStudies } from "@/data/learn";
import { PageHeader } from "@/components/ui-elements";
import { ExternalLink, ChevronRight, ChevronDown, ChevronUp, Search } from "lucide-react";

type FrameworkFilter = "All" | "Climate" | "Nature" | "Cross-cutting" | "Reporting" | "Social";

function LearnContent() {
  const [frameworkFilter, setFrameworkFilter] = useState<FrameworkFilter>("All");
  const searchParams = useSearchParams();
  // Initialize from URL param immediately (lazy initializer) — prevents flash of unfiltered results
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");

  // Sync when searchParams changes via client-side navigation (e.g. back/forward)
  useEffect(() => {
    const q = searchParams.get("q");
    setSearchQuery(q ?? "");
  }, [searchParams]);

  const q = searchQuery.trim().toLowerCase();

  const filteredFrameworks = frameworks.filter((f) => {
    const matchesCategory = frameworkFilter === "All" || f.category === frameworkFilter;
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      f.fullName.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.aseanContext.toLowerCase().includes(q) ||
      f.status.toLowerCase().includes(q)
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
      cs.company.toLowerCase().includes(q) ||
      cs.title.toLowerCase().includes(q) ||
      cs.summary.toLowerCase().includes(q) ||
      cs.outcome.toLowerCase().includes(q) ||
      cs.lessonLearned.toLowerCase().includes(q) ||
      cs.frameworks.some(f => f.toLowerCase().includes(q))
    );
  });

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
          className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-700 text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-600/40 focus:ring-2 focus:ring-purple-400/40 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
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
                type="button"
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

          <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {filteredFrameworks.length} framework{filteredFrameworks.length !== 1 ? "s" : ""} and {filteredCaseStudies.length} case stud{filteredCaseStudies.length !== 1 ? "ies" : "y"} shown
          </p>
          {filteredFrameworks.length === 0 && (
            <p className="text-xs text-gray-500 py-4">No frameworks in this category or search.</p>
          )}

          {filteredFrameworks.length > 0 && (
          <div className="mb-2">
            <div className="space-y-2">
              {filteredFrameworks.map((f) => <FrameworkRow key={f.id} framework={f} query={q} />)}
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

    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="p-8"><div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" /></div>}>
      <LearnContent />
    </Suspense>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  if (!lower.includes(qLower)) return <>{text}</>;
  // Highlight all occurrences, not just the first
  const parts: React.ReactNode[] = [];
  let pos = 0;
  let matchIdx = lower.indexOf(qLower);
  while (matchIdx !== -1) {
    if (matchIdx > pos) parts.push(text.slice(pos, matchIdx));
    parts.push(<mark key={matchIdx} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{text.slice(matchIdx, matchIdx + query.length)}</mark>);
    pos = matchIdx + query.length;
    matchIdx = lower.indexOf(qLower, pos);
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return <>{parts}</>;
}

function FrameworkRow({ framework: f, query }: { framework: (typeof frameworks)[0]; query: string }) {
  const [expanded, setExpanded] = useState(false);

  const categoryColors: Record<string, string> = {
    Climate: "text-emerald-700",
    Nature: "text-green-700",
    "Cross-cutting": "text-purple-700",
    Reporting: "text-amber-700",
    Social: "text-blue-700",
  };
  const statusStyles: Record<string, string> = {
    Mandatory: "text-red-700 bg-red-50 border-red-300",
    Voluntary: "text-blue-700 bg-blue-50 border-blue-300",
    Emerging: "text-amber-700 bg-amber-50 border-amber-300",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 transition-colors">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg"
        onClick={() => setExpanded((e) => !e)}
        role="button"
        aria-expanded={expanded}
        aria-controls={`framework-details-${f.id}`}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((v) => !v); } }}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-base font-bold ${categoryColors[f.category] ?? "text-gray-600"} bg-gray-100`}>
          {f.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-gray-900 truncate"><Highlight text={f.name} query={query} /></span>
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
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <span className="text-gray-500 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </div>
      {expanded && (
        <div id={`framework-details-${f.id}`} className="px-3 pb-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 leading-relaxed mt-2 mb-2">{f.description}</p>
          {f.keyRequirements.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 font-medium mb-1">Key Requirements</div>
              <ul className="space-y-1">
                {f.keyRequirements.slice(0, 3).map((req) => (
                  <li key={req} className="flex items-start gap-2 text-xs text-gray-600">
                    <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-500" />
                    {req}
                  </li>
                ))}
              </ul>
              {f.keyRequirements.length > 3 && (
                <p className="text-[10px] text-gray-400 mt-1 pl-5">+{f.keyRequirements.length - 3} more — see full framework documentation</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CaseStudyCard({ study: cs }: { study: (typeof caseStudies)[0] }) {
  const themeColors: Record<string, string> = {
    "Climate Transition": "text-emerald-700 bg-emerald-500/10",
    "Nature & Biodiversity": "text-green-700 bg-green-500/10",
    "Just Transition": "text-orange-700 bg-orange-500/10",
    "Governance": "text-purple-700 bg-purple-500/10",
    "Sustainable Finance": "text-blue-700 bg-blue-500/10",
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
        <div className="text-xs text-emerald-700 font-medium mb-0.5">Key Outcome</div>
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{cs.outcome}</p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
        <div className="text-xs text-gray-600 font-medium mb-0.5">Lesson Learned</div>
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{cs.lessonLearned}</p>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {cs.frameworks.map((fw) => (
          <span key={fw} className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">{fw}</span>
        ))}
      </div>
    </div>
  );
}

