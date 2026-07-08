"use client";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from "recharts";

interface BubblePoint {
  name: string;
  esgScore: number;
  carbonIntensity: number;
  investmentValue: number;
  transitionRisk: string;
  slug: string;
}

const riskColor: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#10b981",
};

interface TooltipPayload {
  payload?: BubblePoint;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0d1526] border border-white/10 rounded-lg p-3 text-xs shadow-lg">
      <div className="font-semibold text-white mb-1">{d.name}</div>
      <div className="text-slate-400">ESG Score: <span className="text-white">{d.esgScore}</span></div>
      <div className="text-slate-400">Carbon Intensity: <span className="text-white">{d.carbonIntensity} tCO₂e/$M</span></div>
      <div className="text-slate-400">Investment: <span className="text-white">S${d.investmentValue}M</span></div>
      <div className="text-slate-400">Transition Risk: <span style={{ color: riskColor[d.transitionRisk] ?? "#94a3b8" }}>{d.transitionRisk}</span></div>
    </div>
  );
}

export function PortfolioBubbleChart({ data }: { data: BubblePoint[] }) {
  if (data.length === 0) return null;
  return (
    <div className="bg-[#0d1526] rounded-xl border border-white/5 p-5 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-white">Portfolio Positioning</h2>
        <div className="text-xs text-slate-500">ESG Score vs. Carbon Intensity · bubble = investment size</div>
      </div>
      <div className="flex items-center gap-4 mb-3">
        {Object.entries(riskColor).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-500">{level}</span>
          </div>
        ))}
        <span className="text-xs text-slate-600 ml-2">Transition Risk</span>
      </div>
      <ResponsiveContainer width="100%" height={240} aria-label="Portfolio positioning chart — ESG Score vs Carbon Intensity">
        <ScatterChart margin={{ top: 8, right: 24, bottom: 16, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="esgScore"
            type="number"
            name="ESG Score"
            domain={[30, 85]}
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            label={{ value: "ESG Score →", position: "insideBottomRight", offset: -4, fill: "#475569", fontSize: 10 }}
          />
          <YAxis
            dataKey="carbonIntensity"
            type="number"
            name="Carbon Intensity"
            domain={[0, 400]}
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            width={42}
            label={{ value: "tCO₂e/$M ↑", angle: -90, position: "insideLeft", offset: 12, fill: "#475569", fontSize: 10 }}
          />
          <ZAxis dataKey="investmentValue" range={[80, 600]} name="Investment (S$M)" />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} fillOpacity={0.75}>
            {data.map((entry) => (
              <Cell key={entry.slug} fill={riskColor[entry.transitionRisk] ?? "#64748b"} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="text-xs text-slate-600 text-center mt-1">Ideal: bottom-right (high ESG, low carbon) · AsiaPower Energy (890 tCO₂e/$M) off-chart</div>
    </div>
  );
}
