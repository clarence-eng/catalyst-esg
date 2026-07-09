import Link from "next/link";
import { companies } from "@/data/companies";
import type { RiskLevel } from "@/data/companies";

const RISK_COLUMNS = [
  { key: "physical", label: "Physical Risk" },
  { key: "transition", label: "Transition Risk" },
  { key: "nature", label: "Nature Risk" },
  { key: "governance", label: "Governance Risk" },
] as const;

type RiskColumnKey = (typeof RISK_COLUMNS)[number]["key"];

function deriveGovernanceRisk(co: (typeof companies)[0]): RiskLevel {
  const govIssues = co.materialIssues.filter((i) => i.category === "Governance" && !i.opportunity);
  const hasCritical = govIssues.some((i) => i.severity === "Critical");
  const hasHigh = govIssues.some((i) => i.severity === "High");
  const hasMedium = govIssues.some((i) => i.severity === "Medium");
  if (hasCritical) return "Critical";
  if (hasHigh) return "High";
  if (hasMedium) return "Medium";
  return "Low";
}

function getRiskForColumn(co: (typeof companies)[0], colKey: RiskColumnKey): RiskLevel {
  if (colKey === "physical") return co.climateRisk.physical;
  if (colKey === "transition") return co.climateRisk.transition;
  if (colKey === "nature") return co.natureRisk.overall;
  return deriveGovernanceRisk(co);
}

function RiskCell({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    Critical: "bg-red-500/20 text-red-400 border-red-500/30",
    High: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Medium: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    Low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  };
  return (
    <div className={`px-2 py-1.5 rounded border text-center text-xs font-medium ${styles[level]}`}>
      {level}
    </div>
  );
}

export function RiskHeatmap() {
  const activeCompanies = companies.filter((c) => c.portfolioStatus === "Active");

  return (
    <div className="bg-[#0d1526] rounded-xl border border-white/5 mb-8">
      <div className="px-6 py-4 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white">Risk Matrix</h2>
        <p className="text-xs text-slate-500 mt-0.5">Material risk exposure across active portfolio companies</p>
      </div>
      <div className="p-5 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th scope="col" className="text-left text-xs text-slate-500 font-medium pb-3 pr-4 w-40">Company</th>
              {RISK_COLUMNS.map((col) => (
                <th scope="col" key={col.key} className="text-center text-xs text-slate-500 font-medium pb-3 px-2">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {activeCompanies.map((co) => (
              <tr key={co.slug} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/scout/${co.slug}`}
                    className="text-xs font-medium text-white hover:text-emerald-300 transition-colors"
                  >
                    {co.name}
                  </Link>
                  <div className="text-xs text-slate-600 mt-0.5">{co.country}</div>
                </td>
                {RISK_COLUMNS.map((col) => (
                  <td key={col.key} className="py-2.5 px-2">
                    <RiskCell level={getRiskForColumn(co, col.key)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
          <span className="text-xs text-slate-600 font-medium">Legend:</span>
          {(["Critical", "High", "Medium", "Low"] as RiskLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <RiskCell level={level} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
