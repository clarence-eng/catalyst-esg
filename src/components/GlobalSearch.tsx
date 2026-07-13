"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCompanies } from "@/lib/useCompanies";
import { frameworks } from "@/data/learn";
import { Search, X, Building2, BookOpen } from "lucide-react";

export function GlobalSearch() {
  const { companies, loading } = useCompanies();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't hijack Cmd+K when user is typing in a form input
      const target = e.target as HTMLElement;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.contentEditable === "true";
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        if (isInput) return;
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [open]);

  const q = query.toLowerCase();
  const allMatchedCompanies = q.length < 2 ? [] : companies.filter(c =>
    c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
  );
  const matchedCompanies = allMatchedCompanies.slice(0, 5);
  const extraCompanies = allMatchedCompanies.length - matchedCompanies.length;
  const matchedFrameworks = q.length < 2 ? [] : frameworks.filter(f =>
    f.name.toLowerCase().includes(q) || f.fullName.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
  ).slice(0, 4);
  const hasResults = matchedCompanies.length > 0 || matchedFrameworks.length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" data-modal="search" role="presentation" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Search companies and frameworks" className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search companies, frameworks..."
            aria-label="Search companies and frameworks"
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-400 rounded"
          />
          <button type="button" onClick={() => setOpen(false)} aria-label="Close search" className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        {query.length >= 2 && (
          <div className="max-h-80 overflow-y-auto" aria-live="polite" aria-atomic="true">
            {!hasResults && (
              <p className="text-sm text-gray-500 text-center py-8">No results for &ldquo;{query}&rdquo;</p>
            )}
            {matchedCompanies.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Companies</div>
                {matchedCompanies.map(c => (
                  <button key={c.slug} type="button" onClick={() => { router.push(`/scout/${c.slug}`); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                      <div className="text-xs text-gray-500 truncate">{c.sector} · {c.country}</div>
                    </div>
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                      ["AAA","AA","A"].includes(c.esgScore.rating) ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      ["BBB","BB"].includes(c.esgScore.rating) ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-red-50 text-red-700 border border-red-200"
                    }`}>{c.esgScore.rating}</span>
                  </button>
                ))}
                {extraCompanies > 0 && (
                  <div className="px-4 py-1.5 text-[10px] text-gray-400">+{extraCompanies} more — refine your search</div>
                )}
              </div>
            )}
            {matchedFrameworks.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Frameworks</div>
                {matchedFrameworks.map(f => (
                  <button key={f.id} type="button" onClick={() => { router.push(`/learn?q=${encodeURIComponent(query)}`); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                    <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{f.name}</div>
                      <div className="text-xs text-gray-500 truncate">{f.category} · {f.status}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {query.length < 2 && (
          <div className="px-4 py-6 text-center">
            {loading ? (
              <p className="text-sm text-gray-400">Loading companies…</p>
            ) : (
              <p className="text-sm text-gray-400">Type 2+ characters to search companies and frameworks</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Press <kbd className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-mono">Esc</kbd> to close</p>
          </div>
        )}

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-end gap-3">
          <span className="text-[10px] text-gray-400 font-mono">↵ to navigate</span>
          <span className="text-[10px] text-gray-400 font-mono">Esc to close</span>
        </div>
      </div>
    </div>
  );
}
