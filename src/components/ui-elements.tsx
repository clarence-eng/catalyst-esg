import type { ReactNode } from "react";
import { type RiskLevel, type MaturityLevel, type ESGRating } from "@/data/companies";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    Low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    Medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    High: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    Critical: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[level]}`}>
      {level}
    </span>
  );
}

export function MaturityBadge({ level }: { level: MaturityLevel }) {
  const styles: Record<MaturityLevel, string> = {
    Leading: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    Advanced: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    Developing: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    Lagging: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[level]}`}>
      {level}
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
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
          : isAmber
          ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
          : "bg-red-500/15 text-red-400 border-red-500/20"
      }`}
    >
      {rating}
    </span>
  );
}

export function ScoreRing({ score, size = 80, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : score >= 35 ? "#f97316" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
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
        <text
          x={size / 2}
          y={size / 2}
          dominantBaseline="middle"
          textAnchor="middle"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px`, fill: "white", fontSize: size > 60 ? "16px" : "12px", fontWeight: "700" }}
        >
          {score}
        </text>
      </svg>
      {label && <span className="text-xs text-slate-500">{label}</span>}
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
    default: "border-white/5",
    green: "border-emerald-600/20 bg-emerald-600/5",
    amber: "border-amber-500/20 bg-amber-500/5",
    red: "border-red-500/20 bg-red-500/5",
  };
  return (
    <div className={`bg-[#0d1526] rounded-xl border p-4 transition-all duration-200 ${colorStyles[color]}`}>
      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 mt-1 text-sm">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
