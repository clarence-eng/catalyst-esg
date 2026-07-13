"use client";
import { useState, useEffect } from "react";

export function useTheme() {
  // Start with "light" for SSR safety (no hydration mismatch)
  // The layout.tsx inline script applies dark class before first paint
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Read the actual applied theme from the DOM class (set by the pre-paint inline script)
    // This is synchronous and matches what the user actually sees after first paint
    const stored = localStorage.getItem("catalyst-theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("catalyst-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return { theme, toggle };
}
