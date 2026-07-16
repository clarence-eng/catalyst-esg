import Link from "next/link";
import { companies as staticCompanies } from "@/data/companies";
import type { RiskLevel, Company } from "@/data/companies";

const RISK_COLUMNS = [
  { key: "physical", label: "Physical Risk" },
  { key: "transition", label: "Transition Risk" },
  { key: "nature", label: "Nature Risk" },
  { key: "governance", label: "Governance Risk" },
] as const;

type RiskColumnKey = (typeof RISK_COLUMNS)[number]["key"];

function deriveGovernanceRisk(co: Company): RiskLevel {
  const govIssues = co.materialIssues.filter((i) => i.category === "Governance" && !i.opportunity);
  const hasCritical = govIssues.some((i) => i.severity === "Critical");
  const hasHigh = govIssues.some((i) => i.severity === "High");
  const hasMedium = govIssues.some((i) => i.severity === "Medium");
  if (hasCritical) return "Critical";
  if (hasHigh) return "High";
  if (hasMedium) return "Medium";
  return "Low";
}

function getRiskForColumn(co: Company, colKey: RiskColumnKey): RiskLevel {
  if (colKey === "physical") return co.climateRisk.physical;
  if (colKey === "transition") return co.climateRisk.transition;
  if (colKey === "nature") return co.natureRisk.overall;
  return deriveGovernanceRisk(co);
}

function RiskCell({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    Critical: "bg-red-50 text-red-700 border-red-300",
    High: "bg-orange-50 text-orange-700 border-orange-300",
    Medium: "bg-amber-50 text-amber-700 border-amber-300",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-300",
  };
  return (
    <div className={`px-2 py-1.5 rounded border text-center text-xs font-medium ${styles[level]}`}>
      {level}
    </div>
  );
}

export function RiskHeatmap({ companies = staticCompanies }: { companies?: Company[] }) {
  const activeCompanies = companies.filter((c) => c.portfolioStatus === "Active");

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-8">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Risk Matrix</h2>
        <p className="text-xs text-gray-500 mt-0.5">Material risk exposure across active portfolio companies</p>
      </div>
      <div className="p-5 overflow-x-auto">
        <table className="w-full" aria-label="Risk matrix — material risk exposure across active portfolio companies">
          <thead>
            <tr>
              <th scope="col" className="text-left text-xs text-gray-500 font-medium pb-3 pr-4 w-40 min-w-[160px]">Company</th>
              {RISK_COLUMNS.map((col) => (
                <th scope="col" key={col.key} className="text-center text-xs text-gray-500 font-medium pb-3 px-2">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeCompanies.length === 0 ? (
              <tr>
                <td colSpan={RISK_COLUMNS.length + 1} className="py-8 text-center text-xs text-gray-500">No active companies to display</td>
              </tr>
            ) : activeCompanies.map((co) => (
              <tr key={co.slug} className="hover:bg-gray-50 transition-colors">
                <th scope="row" className="py-2.5 pr-4 text-left font-normal w-40 min-w-[160px]">
                  <Link
                    href={`/scout/${co.slug}`}
                    className="text-xs font-medium text-gray-900 hover:text-purple-700 transition-colors block truncate max-w-[156px]"
                    title={co.name}
                  >
                    {co.name}
                  </Link>
                  <div className="text-xs text-gray-500 mt-0.5">{co.country}</div>
                </th>
                {RISK_COLUMNS.map((col) => (
                  <td key={col.key} className="py-2.5 px-2">
                    <RiskCell level={getRiskForColumn(co, col.key)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div role="group" aria-label="Risk level legend" className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
          <span className="text-xs text-gray-500 font-medium" aria-hidden="true">Legend:</span>
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
