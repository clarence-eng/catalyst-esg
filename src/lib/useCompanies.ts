"use client";
import { useState, useEffect } from "react";
import type { Company } from "@/data/companies";
import { companies as staticCompanies } from "@/data/companies";

let cachedResult: { companies: Company[]; source: "static" | "supabase" } | null = null;
// In-flight promise deduplication — all concurrent mounts share one fetch
let inFlight: Promise<void> | null = null;
// Epoch counter — incremented on clearCache() so stale in-flight writes are rejected
let cacheEpoch = 0;

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
      if (cachedResult.source === "static") setLiveDataError(true);
      return;
    }

    // If another mount is already fetching, attach to its promise instead of firing a new request
    if (inFlight) {
      // Capture epoch now — reject if clearCache() fires before the promise settles
      const subscriberEpoch = cacheEpoch;
      inFlight.then(() => {
        if (cacheEpoch !== subscriberEpoch) return; // stale — cache was cleared mid-flight
        if (cachedResult) {
          setCompanies(cachedResult.companies);
          setSource(cachedResult.source);
          if (cachedResult.source === "static") setLiveDataError(true);
        } else {
          setLiveDataError(true);
        }
        setLoading(false);
      });
      setLoading(true);
      return;
    }

    setLoading(true);
    // Capture epoch at fetch start — reject write if clearCache() was called while in-flight
    const epochAtStart = cacheEpoch;
    inFlight = fetch("/api/companies")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ companies: cos, source: src }: { companies: Company[]; source: "static" | "supabase" }) => {
        // Discard result if cache was cleared after this fetch started
        if (cacheEpoch !== epochAtStart) return;
        if (cos && cos.length > 0) {
          cachedResult = { companies: cos, source: src };
          setCompanies(cos);
          setSource(src);
          if (src === "static") setLiveDataError(true);
        } else {
          setLiveDataError(true);
        }
      })
      .catch(() => { setLiveDataError(true); })
      .finally(() => { setLoading(false); inFlight = null; });
  }, []);

  return { companies, loading, source, liveDataError };
}

export function clearCache() {
  cachedResult = null;
  inFlight = null;
  cacheEpoch++;
}
