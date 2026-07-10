"use client";
import { useState, useEffect } from "react";
import type { Company } from "@/data/companies";
import { companies as staticCompanies } from "@/data/companies";

let cachedResult: Company[] | null = null;

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>(staticCompanies);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"static" | "supabase">("static");

  useEffect(() => {
    // Use cache if available
    if (cachedResult) {
      setCompanies(cachedResult);
      setSource("supabase");
      return;
    }

    setLoading(true);
    fetch("/api/companies")
      .then(r => r.json())
      .then(({ companies: cos, source: src }) => {
        if (cos && cos.length > 0) {
          cachedResult = cos;
          setCompanies(cos);
          setSource(src);
        }
      })
      .catch(() => {/* keep static */})
      .finally(() => setLoading(false));
  }, []);

  return { companies, loading, source };
}

export function clearCache() {
  cachedResult = null;
}
