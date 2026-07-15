"use client";
import { type Company } from "@/data/companies";
import { X, BarChart3 } from "lucide-react";
import Link from "next/link";

interface Props {
  companies: Company[];
  onRemove: (slug: string) => void;
  onClear: () => void;
  onDismiss?: () => void;
}

export function ComparisonDrawer({ companies, onRemove, onClear, onDismiss }: Props) {
  if (companies.length === 0) return null;

  const metrics = [
    { label: "ESG Score", fn: (c: Company) => c.esgScore.overall, unit: "/100", lowerIsBetter: false, color: (v: number) => v >= 65 ? "text-emerald-700" : v >= 40 ? "text-amber-700" : "text-red-700" },
    { label: "Environmental", fn: (c: Company) => c.esgScore.environmental, unit: "", lowerIsBetter: false, color: (v: number) => v >= 65 ? "text-emerald-700" : v >= 40 ? "text-amber-700" : "text-red-700" },
    { label: "Social", fn: (c: Company) => c.esgScore.social, unit: "", lowerIsBetter: false, color: (v: number) => v >= 65 ? "text-emerald-700" : v >= 40 ? "text-amber-700" : "text-red-700" },
    { label: "Governance", fn: (c: Company) => c.esgScore.governance, unit: "", lowerIsBetter: false, color: (v: number) => v >= 65 ? "text-emerald-700" : v >= 40 ? "text-amber-700" : "text-red-700" },
    { label: "Carbon Intensity", fn: (c: Company) => c.carbonIntensity, unit: " tCO₂/$M", lowerIsBetter: true, color: (v: number) => v < 100 ? "text-emerald-700" : v < 500 ? "text-amber-700" : "text-red-700" },
    { label: "Green Revenue", fn: (c: Company) => c.greenRevenuePct, unit: "%", lowerIsBetter: false, color: (v: number) => v >= 30 ? "text-emerald-700" : v >= 10 ? "text-amber-700" : "text-red-700" },
    { label: "Transition Risk", fn: (c: Company) => c.climateRisk.transition, unit: "", lowerIsBetter: false, color: () => "text-gray-700" },
    { label: "Nature Risk", fn: (c: Company) => c.natureRisk.overall, unit: "", lowerIsBetter: false, color: () => "text-gray-700" },
  ];

  return (
    <div className="fixed bottom-0 left-0 sm:left-64 right-0 z-40 bg-white border-t-2 border-purple-600/30 shadow-2xl" data-modal="comparison">
      <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-700" />
          <span className="text-sm font-semibold text-gray-900">Comparing {companies.length} companies</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Clear all</button>
          {onDismiss
            ? <button type="button" onClick={onDismiss} aria-label="Dismiss comparison drawer (selection preserved)" className="text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
            : <button type="button" onClick={onClear} aria-label="Clear and close comparison" className="text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
          }
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" aria-label={`ESG comparison: ${companies.map(c => c.name).join(", ")}`}>
          <thead>
            <tr className="border-b border-gray-100">
              <th scope="col" className="text-left px-4 py-2 text-gray-500 font-medium w-36">Metric</th>
              {companies.map(c => (
                <th key={c.slug} scope="col" className="px-4 py-2 min-w-[140px]">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/scout/${c.slug}`} className="font-semibold text-gray-900 hover:text-purple-700 truncate max-w-[100px]">{c.name}</Link>
                    <button type="button" onClick={() => onRemove(c.slug)} aria-label={`Remove ${c.name} from comparison`} className="text-gray-500 hover:text-gray-700 flex-shrink-0"><X className="w-3 h-3" /></button>
                  </div>
                  <div className="text-gray-500 font-normal truncate">{c.sector.split(" ")[0]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => {
              const values = companies.map(c => m.fn(c));
              const numVals = values.filter(v => typeof v === "number") as number[];
              const best = numVals.length > 1 ? (m.lowerIsBetter ? Math.min(...numVals) : Math.max(...numVals)) : null;
              return (
                <tr key={m.label} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <th scope="row" className="px-4 py-2 text-gray-500 font-medium text-left">{m.label}</th>
                  {companies.map((c, i) => {
                    const v = values[i];
                    const isBest = typeof v === "number" && v === best && numVals.length > 1;
                    return (
                      <td key={c.slug} className={`px-4 py-2 font-semibold ${m.color(v as number)}`}>
                        {v}{m.unit}
                        {isBest && <span className="ml-1 text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded">best</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
