"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCompanies } from "@/lib/useCompanies";
import { frameworks } from "@/data/learn";
import { RatingBadge } from "@/components/ui-elements";
import { Search, X, Building2, BookOpen } from "lucide-react";

export function GlobalSearch() {
  const { companies, loading } = useCompanies();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const navigatingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't hijack Cmd+K when user is typing in a form input
      const target = e.target as HTMLElement;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.contentEditable === "true";
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        if (isInput) return;
        // Don't open if KeyboardShortcuts dialog is already open
        if (document.querySelector("[data-modal='shortcuts']")) return;
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      navigatingRef.current = false;
      triggerRef.current = document.activeElement as HTMLElement;
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      // Only restore focus if not navigating away (navigation = new page handles focus)
      if (!navigatingRef.current) {
        setTimeout(() => triggerRef.current?.focus(), 50);
      }
      navigatingRef.current = false;
    }
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

  // Flat ordered list of all result items for keyboard navigation
  const resultItems: Array<{ id: string; href: string }> = [
    ...matchedCompanies.map(c => ({ id: `co-${c.slug}`, href: `/scout/${c.slug}` })),
    ...matchedFrameworks.map(f => ({ id: `fw-${f.id}`, href: `/learn?q=${encodeURIComponent(query)}` })),
  ];

  // Reset active index when results change
  useEffect(() => { setActiveIdx(-1); }, [query]);

  // Scroll active result into view when navigating with arrow keys
  useEffect(() => {
    if (activeIdx < 0) return;
    const id = resultItems[activeIdx]?.id;
    if (id) document.getElementById(id)?.scrollIntoView({ block: "nearest" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx]);

  const navigateTo = useCallback((href: string) => {
    navigatingRef.current = true;
    router.push(href);
    setOpen(false);
  }, [router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" data-modal="search" role="presentation" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Search companies and frameworks" className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" onClick={e => e.stopPropagation()}
        onKeyDown={(e) => {
          // Focus trap: keep Tab within the dialog
          if (e.key === "Tab") {
            const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
              'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
            );
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
              if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
            } else {
              if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
            }
          }
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={hasResults}
            aria-controls="search-listbox"
            aria-activedescendant={activeIdx >= 0 ? resultItems[activeIdx]?.id : undefined}
            aria-autocomplete="list"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx(i => Math.min(i + 1, resultItems.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx(i => Math.max(i - 1, -1));
              } else if (e.key === "Enter" && activeIdx >= 0 && resultItems[activeIdx]) {
                e.preventDefault();
                navigateTo(resultItems[activeIdx].href);
              } else if (e.key === "Enter" && activeIdx === -1 && resultItems.length > 0) {
                e.preventDefault();
                navigateTo(resultItems[0].href);
              }
            }}
            placeholder="Search companies, frameworks..."
            aria-label="Search companies and frameworks"
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-400 rounded"
          />
          <button type="button" onClick={() => setOpen(false)} aria-label="Close search" className="text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        {query.length >= 2 && (
          <div id="search-listbox" role="listbox" aria-label="Search results" className="max-h-80 overflow-y-auto">
            {!hasResults && (
              <p role="option" aria-selected="false" className="text-sm text-gray-500 text-center py-8">No results for &ldquo;{query}&rdquo;</p>
            )}
            {matchedCompanies.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider" aria-hidden="true">Companies</div>
                {matchedCompanies.map((c, i) => {
                  const isActive = activeIdx === i;
                  return (
                    <button key={c.slug} id={`co-${c.slug}`} role="option" aria-selected={isActive} type="button"
                      onClick={() => navigateTo(`/scout/${c.slug}`)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isActive ? "bg-purple-50" : "hover:bg-gray-50"}`}>
                      <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                        <div className="text-xs text-gray-500 truncate">{c.sector} · {c.country}</div>
                      </div>
                      <span className="ml-auto flex-shrink-0">
                        <RatingBadge rating={c.esgScore.rating} />
                      </span>
                    </button>
                  );
                })}
                {extraCompanies > 0 && (
                  <div className="px-4 py-1.5 text-[10px] text-gray-500">+{extraCompanies} more — refine your search</div>
                )}
              </div>
            )}
            {matchedFrameworks.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider" aria-hidden="true">Frameworks</div>
                {matchedFrameworks.map((f, i) => {
                  const idx = matchedCompanies.length + i;
                  const isActive = activeIdx === idx;
                  return (
                    <button key={f.id} id={`fw-${f.id}`} role="option" aria-selected={isActive} type="button"
                      onClick={() => navigateTo(`/learn?q=${encodeURIComponent(query)}`)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isActive ? "bg-purple-50" : "hover:bg-gray-50"}`}>
                      <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{f.name}</div>
                        <div className="text-xs text-gray-500 truncate">{f.category} · {f.status}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {query.length < 2 && (
          <div className="px-4 py-6 text-center">
            {loading ? (
              <p className="text-sm text-gray-500">Loading companies…</p>
            ) : (
              <p className="text-sm text-gray-500">Type 2+ characters to search companies and frameworks</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Press <kbd className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-mono">Esc</kbd> to close</p>
          </div>
        )}

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-end gap-3">
          <span className="text-[10px] text-gray-500 font-mono">↑↓ to select · ↵ to navigate</span>
          <span className="text-[10px] text-gray-500 font-mono">Esc to close</span>
        </div>
      </div>
    </div>
  );
}
