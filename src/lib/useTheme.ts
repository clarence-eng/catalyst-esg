"use client";
import { useState, useEffect } from "react";

export function useTheme() {
  // Start with "light" for SSR safety (no hydration mismatch)
  // The layout.tsx inline script applies dark class before first paint
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Read the actual applied theme from the DOM class (set by the pre-paint inline script)
    let stored: "light" | "dark" | null = null;
    try { stored = localStorage.getItem("catalyst-theme") as "light" | "dark" | null; } catch { /* storage restricted */ }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = (s: "light" | "dark" | null, prefersDark: boolean) => {
      const resolved = s ?? (prefersDark ? "dark" : "light");
      setTheme(resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };
    applyTheme(stored, mq.matches);

    // Update if user changes OS theme while tab is open (only relevant when no manual preference)
    const onChange = (e: MediaQueryListEvent) => {
      let current: "light" | "dark" | null = null;
      try { current = localStorage.getItem("catalyst-theme") as "light" | "dark" | null; } catch { /* storage restricted */ }
      if (!current) applyTheme(null, e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try { localStorage.setItem("catalyst-theme", next); } catch { /* storage restricted */ }
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return { theme, toggle };
}
