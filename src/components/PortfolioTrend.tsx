"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface TrendPoint {
  period: string;
  e: number;
  s: number;
  g: number;
}

export function PortfolioTrend({ data, activeCount = 5 }: { data: TrendPoint[]; activeCount?: number }) {
  if (data.length < 2) return null;

  const latest = data[data.length - 1];
  const earliest = data[0];
  const eChange = Math.round(latest.e - earliest.e);
  const sChange = Math.round(latest.s - earliest.s);
  const gChange = Math.round(latest.g - earliest.g);

  function sign(n: number) {
    return n > 0 ? `+${n}` : `${n}`;
  }

  return (
    <div className="bg-[#0d1526] rounded-xl border border-white/5 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Portfolio ESG Trajectory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Average E/S/G across {activeCount} active companies · {data[0].period} – {data[data.length - 1].period}</p>
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: "E", value: latest.e, change: eChange, color: "text-emerald-400" },
            { label: "S", value: latest.s, change: sChange, color: "text-blue-400" },
            { label: "G", value: latest.g, change: gChange, color: "text-purple-400" },
          ].map(({ label, value, change, color }) => (
            <div key={label} className="text-center">
              <div className={`text-lg font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-500">{label} <span className={change >= 0 ? "text-emerald-400" : "text-red-400"}>({sign(change)})</span></div>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="period"
            tick={{ fill: "#64748b", fontSize: 9 }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#64748b", fontSize: 9 }}
            width={28}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0d1526",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: 11,
            }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Line type="monotone" dataKey="e" stroke="#10b981" strokeWidth={2} dot={{ r: 2, fill: "#10b981", strokeWidth: 0 }} name="Env" />
          <Line type="monotone" dataKey="s" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2, fill: "#3b82f6", strokeWidth: 0 }} name="Social" />
          <Line type="monotone" dataKey="g" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2, fill: "#8b5cf6", strokeWidth: 0 }} name="Gov" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 justify-center">
        {[{ color: "#10b981", label: "Environmental" }, { color: "#3b82f6", label: "Social" }, { color: "#8b5cf6", label: "Governance" }].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
