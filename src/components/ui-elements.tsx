import type { ReactNode } from "react";
import { type RiskLevel, type MaturityLevel, type ESGRating } from "@/data/companies";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    Low: "bg-emerald-50 text-emerald-700 border-emerald-300",
    Medium: "bg-amber-50 text-amber-700 border-amber-300",
    High: "bg-orange-50 text-orange-700 border-orange-300",
    Critical: "bg-red-50 text-red-700 border-red-300",
  };
  const cls = styles[level] ?? "bg-gray-50 text-gray-500 border-gray-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {level ?? "—"}
    </span>
  );
}

export function MaturityBadge({ level }: { level: MaturityLevel }) {
  const styles: Record<MaturityLevel, string> = {
    Leading: "bg-emerald-50 text-emerald-700 border-emerald-300",
    Advanced: "bg-blue-50 text-blue-700 border-blue-300",
    Developing: "bg-amber-50 text-amber-700 border-amber-300",
    Lagging: "bg-red-50 text-red-700 border-red-300",
  };
  const cls = styles[level] ?? "bg-gray-50 text-gray-500 border-gray-300";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
      {level ?? "—"}
    </span>
  );
}

export function RatingBadge({ rating }: { rating: ESGRating }) {
  const isGreen = ["AAA", "AA", "A"].includes(rating);
  const isAmber = ["BBB", "BB"].includes(rating);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-bold border ${
        isGreen
          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
          : isAmber
          ? "bg-amber-50 text-amber-700 border-amber-300"
          : "bg-red-50 text-red-700 border-red-300"
      }`}
    >
      {rating}
    </span>
  );
}

export function ScoreRing({ score: rawScore, size = 80, label }: { score: number; size?: number; label?: string }) {
  // Guard against NaN/Infinity so the ring never renders corrupted values
  const safe = isNaN(rawScore) || !isFinite(rawScore) ? 0 : rawScore;
  const score = Math.max(0, Math.min(100, safe));
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 65 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90 score-ring" role="img" aria-label={label ? `${label} score: ${score} out of 100` : `Score: ${score} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth={6} className="score-ring-track" />
        {score > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
        )}
        <text
          aria-hidden="true"
          x={size / 2}
          y={size / 2}
          dominantBaseline="middle"
          textAnchor="middle"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px`, transformBox: "view-box", fill: "#1f2937", fontSize: size > 60 ? "16px" : "12px", fontWeight: "700" }}
        >
          {score}
        </text>
      </svg>
      {label && <span className="text-xs text-gray-600">{label}</span>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  color = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "default" | "green" | "amber" | "red";
}) {
  const colorStyles = {
    default: "border-gray-200",
    green: "border-emerald-600/20 bg-emerald-600/5",
    amber: "border-amber-500/20 bg-amber-500/5",
    red: "border-red-500/20 bg-red-500/5",
  };
  return (
    <div role="figure" aria-label={`${label}: ${value}${sub ? ` (${sub})` : ""}`} className={`bg-white rounded-xl border p-4 transition-all duration-200 ${colorStyles[color]}`}>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1" aria-hidden="true">{label}</div>
      <div className="text-2xl font-bold text-gray-900" aria-hidden="true">{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5" aria-hidden="true">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-1 text-sm">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
