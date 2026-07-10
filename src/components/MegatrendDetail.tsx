"use client";
import { useState } from "react";
import Link from "next/link";
import { type Megatrend } from "@/data/megatrends";
import { Loader2, FileText, TrendingUp, AlertTriangle, Copy } from "lucide-react";
import { AIOutput } from "@/components/AIOutput";
import { formatRelativeTime } from "@/lib/utils";

const colorMap: Record<string, string> = {
  emerald: "border-emerald-600/20 bg-emerald-600/5",
  green: "border-green-600/20 bg-green-600/5",
  orange: "border-orange-500/20 bg-orange-500/5",
  blue: "border-blue-500/20 bg-blue-500/5",
  purple: "border-purple-500/20 bg-purple-500/5",
};
const colorTextMap: Record<string, string> = {
  emerald: "text-emerald-700",
  green: "text-green-700",
  orange: "text-orange-700",
  blue: "text-blue-700",
  purple: "text-purple-700",
};
const urgencyMap: Record<string, string> = {
  Immediate: "text-red-700 bg-red-100",
  "Near-term": "text-amber-700 bg-amber-100",
  "Long-term": "text-blue-700 bg-blue-100",
};

export function MegatrendDetail({ trend: t }: { trend: Megatrend }) {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [briefGeneratedAt, setBriefGeneratedAt] = useState<Date | null>(null);

  async function generateBrief() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "thematic_brief",
          context: {
            theme: t.title,
            subtitle: t.subtitle,
            temasekAlignment: t.temasekAlignment,
            frameworks: t.frameworks.join(", "),
            portfolioExposure: t.portfolioExposure
              .filter((p) => p.exposure === "High" || p.exposure === "Medium")
              .map((p) => `${p.name} (${p.exposure} exposure)`)
              .join(", "),
          },
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      let data: { error?: string; text?: string };
      try { data = await res.json(); } catch { throw new Error(`Request failed: ${res.status} (unexpected response format)`); }
      if (data.error) throw new Error(data.error);
      if (!data.text) throw new Error("No content received from AI");
      setBrief(data.text);
      setBriefGeneratedAt(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate brief");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className={`rounded-xl border p-6 mb-8 ${colorMap[t.color] ?? "border-gray-200 bg-gray-100"}`}>
        <div className="flex items-start justify-between">
          <div>
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded mb-3 ${urgencyMap[t.urgency] ?? "text-gray-600 bg-gray-200"}`}>
              {t.urgency}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.title}</h1>
            <p className="text-gray-600 text-sm mb-3">{t.subtitle}</p>
            <p className="text-sm text-gray-700 leading-relaxed max-w-3xl">{t.summary}</p>
          </div>
          <div className="text-right ml-6 flex-shrink-0">
            <div className="text-xs text-gray-500 mb-1">Temasek Megatrend</div>
            <div className={`text-sm font-medium ${colorTextMap[t.color] ?? "text-gray-600"}`}>{t.temasekAlignment}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Stats + Implications */}
        <div className="col-span-2 space-y-5">
          {/* Key Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Key Data Points</h3>
            <div className="grid grid-cols-2 gap-3">
              {t.keyStats.map((stat) => (
                <div key={stat.label} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900 mb-0.5">{stat.value}</div>
                  <div className="text-xs text-gray-600 mb-1">{stat.label}</div>
                  <div className="text-xs text-gray-600">Source: {stat.source}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Investment Implications */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Investment Implications</h3>
            <div className="space-y-3">
              {t.investmentImplications.map((imp, i) => (
                <div key={`${imp.type}-${imp.sector}-${i}`} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  imp.type === "Risk"
                    ? "bg-red-500/5 border-red-500/15"
                    : "bg-emerald-500/5 border-emerald-500/15"
                }`}>
                  {imp.type === "Risk"
                    ? <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                    : <TrendingUp className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  }
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-medium ${imp.type === "Risk" ? "text-red-700" : "text-emerald-700"}`}>
                        {imp.type}
                      </span>
                      <span className="text-xs text-gray-500">{imp.sector}</span>
                    </div>
                    <p className="text-sm text-gray-700">{imp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Thematic Brief Generator */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">AI Thematic Brief</h3>
                <p className="text-xs text-gray-500 mt-0.5">Generate a 600-word investment-grade brief on this megatrend</p>
              </div>
              <button
                onClick={generateBrief}
                disabled={loading}
                aria-busy={loading}
                className="flex items-center gap-2 text-sm bg-[#4B2580] hover:bg-[#3D1A6E] disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {loading ? "Generating..." : brief ? "Regenerate" : "Generate Brief"}
              </button>
            </div>
            {error && (
              <div role="alert" className="text-xs text-red-700 bg-red-50 border border-red-300 rounded-lg p-3 mb-3">
                {error}
              </div>
            )}
            {brief ? (
              <>
                {loading && <div className="text-xs text-gray-500 text-center py-2 mb-2">Regenerating…</div>}
                <AIOutput text={brief} />
              </>
            ) : loading ? (
              <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg animate-pulse">
                Generating brief…
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg">
                <div>Generate a Temasek Sustainability Group-style thematic investment brief using AI</div>
                <div className="text-gray-500 mt-1">Requires GEMINI_API_KEY in .env.local</div>
              </div>
            )}
            {brief && (
              <div className="mt-3 flex items-center">
                <button
                  onClick={() => navigator.clipboard?.writeText(brief).catch(() => {})}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy to clipboard
                </button>
                <span className="text-xs text-gray-500 ml-auto">
                  {briefGeneratedAt ? `Generated ${formatRelativeTime(briefGeneratedAt)}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Frameworks + Portfolio Exposure */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Relevant Frameworks</h3>
            <div className="space-y-2">
              {t.frameworks.map((f) => (
                <div key={f} className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-3 py-2 rounded-lg">
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Portfolio Exposure</h3>
            <div className="space-y-2">
              {t.portfolioExposure.map((p) => (
                <div key={p.slug} className="flex items-center justify-between">
                  <Link href={`/scout/${p.slug}`} className="text-xs text-gray-600 hover:text-purple-700 transition-colors truncate mr-2">{p.name}</Link>
                  <ExposureBadge level={p.exposure} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExposureBadge({ level }: { level: "High" | "Medium" | "Low" }) {
  const styles: Record<string, string> = {
    High: "bg-red-50 text-red-700 border-red-300",
    Medium: "bg-amber-50 text-amber-700 border-amber-300",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${styles[level]}`}>
      {level}
    </span>
  );
}
