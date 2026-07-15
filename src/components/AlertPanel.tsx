import Link from "next/link";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { type Company } from "@/data/companies";

interface Alert {
  message: string;
  slug: string;
  severity: 1 | 2 | 3; // 1 = highest
}

function generateAlerts(companies: Company[]): { visible: Alert[]; hiddenLower: number } {
  const activeCompanies = companies.filter((c) => c.portfolioStatus === "Active");
  const alerts: Alert[] = [];

  // 1. Critical material issues — highest priority (unmitigated financial material risks)
  for (const co of activeCompanies) {
    for (const issue of co.materialIssues) {
      if (issue.severity === "Critical" && !issue.opportunity) {
        alerts.push({
          message: `${co.name}: Critical ESG issue — ${issue.issue}`,
          slug: co.slug,
          severity: 1,
        });
      }
    }
  }

  // 2. Overdue engagements (max 1 alert per company to prevent one company dominating)
  for (const co of activeCompanies) {
    const overdueEngs = co.engagement
      .filter(e => e.status === "Overdue")
      .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0); // ascending: oldest first
    if (overdueEngs.length > 0) {
      const count = overdueEngs.length;
      const topic = overdueEngs[0].topic;
      alerts.push({
        message: count > 1
          ? `${co.name}: ${count} overdue engagements (oldest: "${topic}")`
          : `${co.name}: Overdue engagement — "${topic}"`,
        slug: co.slug,
        severity: 2,
      });
    }
  }

  // 3. Declining E score (last < second-to-last) — sort by period to ensure chronological order
  for (const co of activeCompanies) {
    const scores = [...co.historicalScores].sort((a, b) => {
      const [aq, ay] = (a.period.match(/Q(\d) (\d{4})/) || ["", "0", "0"]).slice(1).map(Number);
      const [bq, by] = (b.period.match(/Q(\d) (\d{4})/) || ["", "0", "0"]).slice(1).map(Number);
      return ay !== by ? ay - by : aq - bq;
    });
    if (scores.length >= 2) {
      const last = scores[scores.length - 1];
      const prev = scores[scores.length - 2];
      if (last.e < prev.e) {
        alerts.push({
          message: `${co.name}: E score declining (${prev.e} → ${last.e} in ${last.period})`,
          slug: co.slug,
          severity: 3,
        });
      }
    }
  }

  // Sort by severity (lowest number = highest severity first)
  alerts.sort((a, b) => a.severity - b.severity);

  // Critical (sev1) alerts are never truncated — missing a Critical ESG alert is a material gap.
  // sev2 (overdue engagements) always takes priority over sev3 (trend warnings).
  const sev1 = alerts.filter(a => a.severity === 1);
  const sev2 = alerts.filter(a => a.severity === 2);
  const sev3 = alerts.filter(a => a.severity === 3);
  const CAP = Math.max(6, sev1.length); // always show all Critical
  const remaining = CAP - sev1.length;
  const sev2Take = Math.min(sev2.length, remaining);
  const sev3Take = Math.min(sev3.length, remaining - sev2Take);
  const hiddenLower = (sev2.length - sev2Take) + (sev3.length - sev3Take);
  return {
    visible: [...sev1, ...sev2.slice(0, sev2Take), ...sev3.slice(0, sev3Take)],
    hiddenLower,
  };
}

export function AlertPanel({ companies }: { companies: Company[] }) {
  const { visible: alerts, hiddenLower } = generateAlerts(companies);

  if (alerts.length === 0) return (
    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 mb-6 flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
      <p className="text-xs text-emerald-800 font-medium">No active alerts — portfolio engagements and ESG scores are on track.</p>
    </div>
  );

  return (
    <div className="rounded-xl border border-amber-400/40 bg-amber-50 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-amber-700" />
        <h2 className="text-sm font-semibold text-gray-900">Portfolio Alerts</h2>
        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full font-medium">
          {alerts.length}
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={`${alert.slug}-${alert.severity}-${i}`}
            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
          >
            {alert.severity === 1
              ? <AlertCircle className="w-3.5 h-3.5 text-red-700 flex-shrink-0" />
              : alert.severity === 2
              ? <AlertTriangle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
              : <Info className="w-3.5 h-3.5 text-blue-700 flex-shrink-0" />
            }
            <span className="text-xs text-gray-700 flex-1">{alert.message}</span>
            <Link
              href={`/scout/${alert.slug}`}
              aria-label={`View — ${alert.message}`}
              className="text-xs text-purple-600 hover:text-purple-800"
            >
              View →
            </Link>
          </div>
        ))}
        {hiddenLower > 0 && (
          <div className="text-xs text-gray-500 text-center pt-1">
            +{hiddenLower} lower-priority alert{hiddenLower > 1 ? "s" : ""} — view company profiles for full details
          </div>
        )}
      </div>
    </div>
  );
}
