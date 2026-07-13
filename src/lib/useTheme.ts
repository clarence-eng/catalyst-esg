"use client";
import { useState, useEffect } from "react";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem("catalyst-theme") as "light" | "dark" | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch { return "light"; }
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    // Apply on mount to sync the DOM class with the lazy-initialized state
    document.documentElement.classList.toggle("dark", theme === "dark");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("catalyst-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return { theme, toggle };
}
