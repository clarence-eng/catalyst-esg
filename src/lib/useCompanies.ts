"use client";
import { useState, useEffect } from "react";
import type { Company } from "@/data/companies";
import { companies as staticCompanies } from "@/data/companies";

let cachedResult: { companies: Company[]; source: "static" | "supabase" } | null = null;

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>(staticCompanies);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"static" | "supabase">("static");
  const [liveDataError, setLiveDataError] = useState(false);

  useEffect(() => {
    // Use cache if available (preserves actual source label)
    if (cachedResult) {
      setCompanies(cachedResult.companies);
      setSource(cachedResult.source);
      return;
    }

    setLoading(true);
    fetch("/api/companies")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ companies: cos, source: src }: { companies: Company[]; source: "static" | "supabase" }) => {
        if (cos && cos.length > 0) {
          cachedResult = { companies: cos, source: src };
          setCompanies(cos);
          setSource(src);
          // Show error if we fell back to static despite requesting live data
          if (src === "static") setLiveDataError(true);
        }
      })
      .catch(() => { setLiveDataError(true); })
      .finally(() => setLoading(false));
  }, []);

  return { companies, loading, source, liveDataError };
}

export function clearCache() {
  cachedResult = null;
}
