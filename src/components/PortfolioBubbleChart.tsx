"use client";
import { useRouter } from "next/navigation";
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
// WCAG AA–safe text equivalents for tooltip (4.5:1 on white)
const riskTextColor: Record<string, string> = {
  Critical: "#b91c1c",
  High: "#c2410c",
  Medium: "#92400e",
  Low: "#047857",
};

interface TooltipPayload {
  payload?: BubblePoint;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs shadow-lg">
      <div className="font-semibold text-gray-900 mb-1">{d.name}</div>
      <div className="text-gray-600">ESG Score: <span className="text-gray-900">{d.esgScore}</span></div>
      <div className="text-gray-600">Carbon Intensity: <span className="text-gray-900">{d.carbonIntensity} tCO₂e/$M</span></div>
      <div className="text-gray-600">Investment: <span className="text-gray-900">S${d.investmentValue}M</span></div>
      <div className="text-gray-600">Transition Risk: <span style={{ color: riskTextColor[d.transitionRisk] ?? "#374151" }}>{d.transitionRisk}</span></div>
    </div>
  );
}

export function PortfolioBubbleChart({ data }: { data: BubblePoint[] }) {
  const router = useRouter();
  if (data.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-900">Portfolio Positioning</h2>
        <div className="text-xs text-gray-500">ESG Score vs. Carbon Intensity · bubble = investment size</div>
      </div>
      <div className="flex items-center gap-4 mb-3">
        {Object.entries(riskColor).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500">{level}</span>
          </div>
        ))}
        <span className="text-xs text-gray-500 ml-2">Transition Risk</span>
        {data.filter(d => d.carbonIntensity > 400).length > 0 && (
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {data.filter(d => d.carbonIntensity > 400).map(d => (
              <span key={d.slug} className="text-xs text-red-700 bg-red-50 border border-red-300 px-2 py-0.5 rounded">
                ↑ {d.name} ({d.carbonIntensity} tCO₂e/$M) — off chart Y
              </span>
            ))}
          </div>
        )}
      </div>
      <div role="img" aria-label="Portfolio positioning chart — ESG Score vs Carbon Intensity">
      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 8, right: 24, bottom: 16, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="esgScore"
            type="number"
            name="ESG Score"
            domain={[20, 100]}
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
          <Scatter
            data={data}
            fillOpacity={0.75}
            cursor="pointer"
            onClick={(entry: unknown) => {
              const pt = entry as BubblePoint;
              if (pt?.slug) router.push(`/scout/${pt.slug}`);
            }}
          >
            {data.map((entry) => (
              <Cell key={entry.slug} fill={riskColor[entry.transitionRisk] ?? "#64748b"} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      </div>
      {(() => {
        const offChart = data.filter(d => d.carbonIntensity > 400);
        return (
          <div className="text-xs text-gray-500 text-center mt-1">
            Ideal: bottom-right (high ESG, low carbon)
            {offChart.length > 0 && ` · ${offChart.map(d => `${d.name} (${d.carbonIntensity} tCO₂e/$M)`).join(", ")} off-chart`}
          </div>
        );
      })()}
    </div>
  );
}
