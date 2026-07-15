"use client";
import { useEffect, useState } from "react";
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

export function PortfolioTrend({ data, activeCount }: { data: TrendPoint[]; activeCount: number }) {
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (data.length < 2) return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex items-center justify-center h-32">
      <p className="text-xs text-gray-500">Insufficient historical data to display trend</p>
    </div>
  );

  const latest = data[data.length - 1];
  const earliest = data[0];
  const eChange = Math.round(latest.e - earliest.e);
  const sChange = Math.round(latest.s - earliest.s);
  const gChange = Math.round(latest.g - earliest.g);

  function sign(n: number) {
    return n > 0 ? `+${n}` : `${n}`;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Portfolio ESG Trajectory</h2>
          <p className="text-xs text-gray-500 mt-0.5">Average E/S/G across {activeCount} active companies · {data[0].period} – {data[data.length - 1].period}</p>
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: "E", value: Math.round(latest.e), change: eChange, color: "text-emerald-700" },
            { label: "S", value: Math.round(latest.s), change: sChange, color: "text-blue-700" },
            { label: "G", value: Math.round(latest.g), change: gChange, color: "text-purple-700" },
          ].map(({ label, value, change, color }) => (
            <div key={label} className="text-center">
              <div className={`text-lg font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500">{label} <span className={change > 0 ? "text-emerald-700" : change < 0 ? "text-red-600" : "text-gray-500"}>({sign(change)})</span></div>
              <div className="text-[9px] text-gray-500">since {earliest.period}</div>
            </div>
          ))}
        </div>
      </div>
      <div role="img" aria-label={`Portfolio ESG trend from ${data[0].period} to ${data[data.length - 1].period}. Latest: Environmental ${Math.round(latest.e)}, Social ${Math.round(latest.s)}, Governance ${Math.round(latest.g)}. Changes over period: E ${eChange >= 0 ? "+" : ""}${eChange}, S ${sChange >= 0 ? "+" : ""}${sChange}, G ${gChange >= 0 ? "+" : ""}${gChange}.`}>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="period"
            tick={{ fill: "#64748b", fontSize: 9 }}
            tickLine={false}
            interval={0}
            tickFormatter={(v: string) => {
              // Show "Q1'24" style for compactness on 10-point chart
              const m = v.match(/Q(\d) (\d{4})/);
              return m ? `Q${m[1]}'${m[2].slice(2)}` : v;
            }}
          />
          <YAxis
            domain={([dataMin, dataMax]: readonly [number, number]): [number, number] => {
              const range = dataMax - dataMin;
              const pad = range < 5 ? 10 : Math.ceil(range * 0.1);
              return [Math.max(0, dataMin - pad), Math.min(100, dataMax + pad)];
            }}
            tick={{ fill: "#64748b", fontSize: 9 }}
            width={28}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "8px",
              fontSize: 11,
            }}
            labelStyle={{ color: "#6b7280" }}
          />
          <Line type="monotone" dataKey="e" stroke="#10b981" strokeWidth={2} dot={{ r: 2, fill: "#10b981", strokeWidth: 0 }} name="Env" isAnimationActive={!reducedMotion} />
          <Line type="monotone" dataKey="s" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2, fill: "#3b82f6", strokeWidth: 0 }} name="Social" isAnimationActive={!reducedMotion} />
          <Line type="monotone" dataKey="g" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2, fill: "#8b5cf6", strokeWidth: 0 }} name="Gov" isAnimationActive={!reducedMotion} />
        </LineChart>
      </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2 justify-center">
        {[{ color: "#10b981", label: "Environmental" }, { color: "#3b82f6", label: "Social" }, { color: "#8b5cf6", label: "Governance" }].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
