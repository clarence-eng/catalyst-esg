"use client";
import { useState } from "react";
import { Loader2, BarChart3, Copy } from "lucide-react";
import { AIOutput } from "@/components/AIOutput";
import { formatRelativeTime, copyToClipboard } from "@/lib/utils";

interface PortfolioBriefProps {
  portfolioSummary: string;
  companyNames?: string[];
}

export function PortfolioBrief({ portfolioSummary, companyNames = [] }: PortfolioBriefProps) {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "portfolio_brief",
          context: { portfolioSummary },
        }),
      });
      if (!res.ok) {
        const msg = res.status === 429 ? "API quota exceeded — please try again in a moment" : `Request failed: ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }
      let data: { error?: string; text?: string };
      try { data = await res.json(); } catch { throw new Error(`Request failed: ${res.status} (unexpected response format)`); }
      if (data.error) throw new Error(data.error);
      if (!data.text?.trim()) throw new Error("No content received from AI");
      setBrief(data.text);
      setGeneratedAt(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate brief");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Portfolio ESG Brief</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            AI-generated quarterly ESG health summary across all active portfolio companies
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading || !portfolioSummary.trim()}
          aria-busy={loading}
          title={!portfolioSummary.trim() && !loading ? "Add active portfolio companies to generate a brief" : undefined}
          className="flex items-center gap-2 text-sm bg-[#4B2580] hover:bg-[#3D1A6E] disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          {loading ? "Generating..." : brief ? "Regenerate" : "Generate Brief"}
        </button>
      </div>
      {error && (
        <div role="alert" className="text-xs text-red-700 bg-red-50 border border-red-300 rounded-lg p-3 mb-3">
          {error}
        </div>
      )}
      <div aria-live="polite" aria-atomic="false">
      {brief ? (
        <>
          {loading && <div className="text-xs text-gray-500 text-center py-2 mb-2">Regenerating…</div>}
          <AIOutput text={brief} />
          <div className="flex items-center gap-4 mt-3">
            <button
              type="button"
              onClick={async () => {
                const stamp = generatedAt ?? new Date();
                const date = stamp.toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" });
                const quarter = `Q${Math.ceil((stamp.getMonth() + 1) / 3)} ${stamp.getFullYear()}`;
                const count = companyNames.length;
                const names = count > 0 ? companyNames.join(", ") : "Active Portfolio Companies";
                const countLabel = count > 0 ? `${count} ` : "";
                const header = `CATALYST ESG INTELLIGENCE\n${quarter} Portfolio ESG Brief\nPrepared: ${date}\nPortfolio: ${countLabel}Active Companies (${names})\n${"─".repeat(60)}\n\n`;
                await copyToClipboard(header + brief);
                setCopied(true); setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copied ? "Copied!" : "Copy as document"}
            </button>
            {generatedAt && (
              <span className="text-xs text-gray-500">Generated {formatRelativeTime(generatedAt)}</span>
            )}
          </div>
        </>
      ) : loading ? (
        <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg animate-pulse">
          Generating ESG brief…
        </div>
      ) : (
        <div className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg">
          <div>Generate a Temasek-style quarterly ESG portfolio health summary</div>
          <div className="text-gray-500 mt-1">Requires GEMINI_API_KEY in .env.local</div>
        </div>
      )}
      </div>
    </div>
  );
}
