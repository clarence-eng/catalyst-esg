"use client";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      if (isInput) return;

      if (e.key === "?" && !e.metaKey && !e.ctrlKey) { setOpen(o => !o); return; }
      if (e.key === "Escape") { setOpen(false); setGPressed(false); return; }

      // Go-to shortcuts
      if (e.key.toLowerCase() === "g" && !gPressed) { setGPressed(true); setTimeout(() => setGPressed(false), 1500); return; }
      if (gPressed) {
        const nav: Record<string, string> = { o: "/", s: "/scout", t: "/steward", i: "/signal", l: "/learn" };
        const url = nav[e.key.toLowerCase()];
        if (url) { window.location.href = url; setGPressed(false); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gPressed]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setOpen(false)}>
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
