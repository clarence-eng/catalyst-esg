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
  const openRef = useRef(false);
  useEffect(() => { openRef.current = open; }, [open]);
  const [gPressed, setGPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Use a ref to avoid stale closure issues — handler always reads current gPressed value
  const gPressedRef = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const router = useRouter();

  // Keep ref in sync with state
  useEffect(() => { gPressedRef.current = gPressed; }, [gPressed]);

  // Move focus into dialog on open; restore focus to trigger element on close (WCAG 2.4.3)
  useEffect(() => {
    if (open) {
      const active = document.activeElement as HTMLElement;
      // Only capture focusable elements — body/main have no .focus() effect
      triggerRef.current = (active && active !== document.body && active.tabIndex >= -1) ? active : null;
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else {
      if (triggerRef.current) {
        setTimeout(() => triggerRef.current?.focus(), 50);
      }
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.contentEditable === "true";
      if (isInput) return;

      // ? opens/closes the shortcuts dialog; blocked only when search modal is open (not by shortcuts itself)
      const hasSearchModal = document.querySelector("[data-modal='search']");

      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        if (!hasSearchModal) setOpen(o => !o);
        return;
      }
      if (e.key === "Escape") { setOpen(false); setGPressed(false); gPressedRef.current = false; return; }

      // Go-to shortcuts — disabled while shortcuts dialog is open
      if (openRef.current) return;

      // Read from ref so no stale closure, no effect re-run
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
          // Move focus to main content so keyboard users start from the right position on the new page
          setTimeout(() => { document.getElementById("main-content")?.focus(); }, 50);
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
    <div className="fixed bottom-6 left-[280px] z-50">
      {gPressed && (
        <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 ring-1 ring-white/20 animate-bounce-gentle">
          <Keyboard className="w-3 h-3" />
          Press O/S/T/I/L to navigate…
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" data-modal="shortcuts" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-96 max-w-full mx-4" onClick={e => e.stopPropagation()}
        onKeyDown={(e) => {
          // Focus trap: with only the close button focusable, Tab/Shift+Tab both stay on it
          if (e.key === "Tab") {
            const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
              'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
            );
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
              if (!first || document.activeElement === first) { e.preventDefault(); last?.focus(); }
            } else {
              if (!last || document.activeElement === last) { e.preventDefault(); first?.focus(); }
            }
          }
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-purple-700" />
            <h2 id="shortcuts-title" className="text-sm font-semibold text-gray-900">Keyboard Shortcuts</h2>
          </div>
          <button ref={closeButtonRef} type="button" aria-label="Close keyboard shortcuts" onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  k === "then" ? <span key={j} className="text-gray-500 text-xs mx-1">then</span> :
                  <kbd key={j} className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded border border-gray-200 font-mono">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-4 text-center">Press <kbd className="bg-gray-100 text-gray-500 px-1 py-0.5 rounded text-[10px] font-mono">?</kbd> to toggle this panel</p>
      </div>
    </div>
  );
}
