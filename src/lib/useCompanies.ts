"use client";
import { useState, useEffect, useCallback } from "react";
import type { Company } from "@/data/companies";
import { companies as staticCompanies } from "@/data/companies";

let cachedResult: { companies: Company[]; source: "static" | "supabase" } | null = null;
// In-flight promise deduplication — all concurrent mounts share one fetch
let inFlight: Promise<void> | null = null;
// Epoch counter — incremented on clearCache() so stale in-flight writes are rejected
let cacheEpoch = 0;
// Subscriber registry — notified on clearCache() so already-mounted hooks re-fetch
const refreshCallbacks = new Set<() => void>();
// Session-level demo banner: show only once per session (first page to render it)
const DEMO_BANNER_KEY = "catalyst_demo_banner_shown";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>(staticCompanies);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"static" | "supabase">("static");
  const [liveDataError, setLiveDataError] = useState(false);
  const [fetchTick, setFetchTick] = useState(0);

  // Register this instance as a subscriber so clearCache() can trigger a re-fetch
  useEffect(() => {
    const refresh = () => setFetchTick(t => t + 1);
    refreshCallbacks.add(refresh);
    return () => { refreshCallbacks.delete(refresh); };
  }, []);

  const doFetch = useCallback(() => {
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
        if (cacheEpoch !== subscriberEpoch) { setLoading(false); return; } // stale — cache was cleared mid-flight
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
    // Capture local reference so .finally() only nulls inFlight if it's still this promise
    let thisPromise: Promise<void>;
    thisPromise = inFlight = fetch("/api/companies")
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
      .catch(() => { if (cacheEpoch === epochAtStart) setLiveDataError(true); })
      .finally(() => {
        // Only clear loading/inFlight if this fetch wasn't superseded by a clearCache()
        if (cacheEpoch === epochAtStart) setLoading(false);
        if (inFlight === thisPromise) inFlight = null;
      });
  }, []);

  // Re-run fetch whenever fetchTick increments (triggered by clearCache via subscriber registry)
  useEffect(() => { doFetch(); }, [fetchTick, doFetch]);

  // Session-level suppression: only show demo banner on the first page that triggers it per session
  const [showDemoBanner, setShowDemoBanner] = useState(false);
  useEffect(() => {
    if (!liveDataError) return;
    try {
      if (sessionStorage.getItem(DEMO_BANNER_KEY)) return;
      sessionStorage.setItem(DEMO_BANNER_KEY, "1");
      setShowDemoBanner(true);
    } catch { setShowDemoBanner(true); }
  }, [liveDataError]);

  return { companies, loading, source, liveDataError, showDemoBanner };
}

export function clearCache() {
  cachedResult = null;
  inFlight = null;
  cacheEpoch++;
  // Notify all mounted useCompanies() instances to re-fetch
  refreshCallbacks.forEach(cb => cb());
}
