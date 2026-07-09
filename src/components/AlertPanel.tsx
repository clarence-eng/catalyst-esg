import Link from "next/link";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { type Company } from "@/data/companies";

interface Alert {
  message: string;
  slug: string;
  severity: 1 | 2 | 3; // 1 = highest
}

function generateAlerts(companies: Company[]): Alert[] {
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
      const [aq, ay] = (a.period.match(/Q(\d) (\d{4})/) || ["", "0", "9999"]).slice(1).map(Number);
      const [bq, by] = (b.period.match(/Q(\d) (\d{4})/) || ["", "0", "9999"]).slice(1).map(Number);
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

  // Limit to 12 most urgent alerts — ensures all Critical issues AND all overdue
  // engagement alerts can appear simultaneously (current max: 5 Critical + 5 overdue = 10)
  return alerts.slice(0, 12);
}

export function AlertPanel({ companies }: { companies: Company[] }) {
  const alerts = generateAlerts(companies);

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-white">Portfolio Alerts</h2>
        <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
          {alerts.length}
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={`${alert.slug}-${alert.severity}-${i}`}
            className="flex items-center gap-3 p-3 bg-[#0d1526] rounded-lg border border-white/5"
          >
            {alert.severity === 1
              ? <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              : alert.severity === 2
              ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              : <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            }
            <span className="text-xs text-slate-300 flex-1">{alert.message}</span>
            <Link
              href={`/scout/${alert.slug}`}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              View →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
