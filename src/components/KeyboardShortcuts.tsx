"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["⌘", "K"], desc: "Open global search" },
  { keys: ["Esc"], desc: "Close modal / search" },
  { keys: ["?"], desc: "Show keyboard shortcuts" },
  { keys: ["G", "then", "O"], desc: "Go to Overview" },
  { keys: ["G", "then", "S"], desc: "Go to Scout" },
  { keys: ["G", "then", "T"], desc: "Go to Steward" },
  { keys: ["G", "then", "I"], desc: "Go to Signal" },
  { keys: ["G", "then", "L"], desc: "Go to Learn" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const [gPressed, setGPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Use a ref to avoid stale closure issues — handler always reads current gPressed value
  const gPressedRef = useRef(false);
  const router = useRouter();

  // Keep ref in sync with state
  useEffect(() => { gPressedRef.current = gPressed; }, [gPressed]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      if (isInput) return;

      // Don't open shortcuts overlay if any OTHER modal (not shortcuts itself) is already open
      const hasOtherModal = document.querySelector("[data-modal]:not([data-modal='shortcuts'])");

      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        if (!hasOtherModal) setOpen(o => !o);
        return;
      }
      if (e.key === "Escape") { setOpen(false); setGPressed(false); gPressedRef.current = false; return; }

      // Go-to shortcuts — read from ref so no stale closure, no effect re-run
      if (e.key.toLowerCase() === "g" && !gPressedRef.current) {
        setGPressed(true);
        gPressedRef.current = true;
        if (timerRef.current) clearTimeout(timerRef.current);
        // Auto-reset after 1.5s — NOT cancelled by effect cleanup
        timerRef.current = setTimeout(() => { setGPressed(false); gPressedRef.current = false; }, 1500);
        return;
      }
      if (gPressedRef.current) {
        const nav: Record<string, string> = { o: "/", s: "/scout", t: "/steward", i: "/signal", l: "/learn" };
        const url = nav[e.key.toLowerCase()];
        if (url) {
          if (timerRef.current) clearTimeout(timerRef.current);
          router.push(url);
          setGPressed(false);
          gPressedRef.current = false;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      // Don't clear timerRef here — let the auto-reset fire naturally
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Only router in deps — gPressed read via ref to avoid cleanup cancelling the timer

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (!open) return (
    <div className="fixed bottom-6 left-[280px] z-30">
      {gPressed && (
        <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Keyboard className="w-3 h-3" />
          Press O/S/T/I/L to navigate…
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" data-modal="shortcuts" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-96 max-w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-purple-700" />
            <h2 className="text-sm font-semibold text-gray-900">Keyboard Shortcuts</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  k === "then" ? <span key={j} className="text-gray-400 text-xs mx-1">then</span> :
                  <kbd key={j} className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded border border-gray-200 font-mono">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-4 text-center">Press <kbd className="bg-gray-100 text-gray-500 px-1 py-0.5 rounded text-[10px] font-mono">?</kbd> to toggle this panel</p>
      </div>
    </div>
  );
}
