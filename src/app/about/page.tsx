import Link from "next/link";
import { companies } from "@/data/companies";
import { PageHeader } from "@/components/ui-elements";
import { Search, Users, Radio, BookOpen, LayoutDashboard, Cpu, GitMerge, ChevronRight, Target, ClipboardList, BarChart2 } from "lucide-react";

const companyWhy: Record<string, string> = {
  "seaport-logistics": "IMO CII, EU ETS, physical climate risk",
  "nusantara-bank": "Financed emissions, EUDR, JETP",
  "cloudmesh-technologies": "Data centre energy, AI governance",
  "greenharvest-agri": "EUDR, TNFD pilot, deforestation risk",
  "asiapower-energy": "Coal stranded assets, JETP ETM",
  "medilink-health": "AI bias, PDPA, inclusive healthcare",
};

const modules = [
  {
    href: "/",
    icon: LayoutDashboard,
    name: "Overview",
    color: "text-purple-400",
    bg: "bg-purple-600/10 border-purple-600/20",
    description:
      "Portfolio ESG health dashboard. Investment-weighted KPIs, E/S/G trajectory chart, portfolio positioning bubble chart (ESG vs carbon intensity), risk heatmap (physical/transition/nature/governance), needs-attention alert panel with overdue engagements and Critical issues, company table with Active/Pipeline distinction, portfolio weights, and an AI-powered Portfolio ESG Brief generator.",
  },
  {
    href: "/scout",
    icon: Search,
    name: "Scout",
    color: "text-blue-400",
    bg: "bg-blue-600/10 border-blue-600/20",
    description:
      "ESG due diligence for new and existing portfolio companies. Active/Pipeline filter, live search, ESG momentum badges (↑/→/↓), SDG alignment tags, green revenue bars, IC Recommendation panel for pipeline companies, and full company profiles with 5 tabbed views including governance scorecard, TNFD pillar status, engagement completion tracker, and net zero commitment badges.",
  },
  {
    href: "/steward",
    icon: Users,
    name: "Steward",
    color: "text-indigo-400",
    bg: "bg-indigo-600/10 border-indigo-600/20",
    description:
      "Post-investment portfolio engagement tracking. Cards view (urgency-sorted by overdue count) and calendar view (chronological engagement timeline across all companies including pipeline under evaluation). AI-generated 12-month ESG Action Plans with quarterly milestones. Pipeline companies shown separately.",
  },
  {
    href: "/signal",
    icon: Radio,
    name: "Signal",
    color: "text-amber-400",
    bg: "bg-amber-600/10 border-amber-600/20",
    description:
      "ESG megatrend intelligence and regulatory radar. 5 megatrend deep-dives (Climate Transition, Nature & Biodiversity, Just Transition, AI & Digital Ethics, Longer Lifespans) each with investment implications, portfolio exposure, and AI thematic brief generator. Regulatory radar covering 10 regulations across Singapore, EU, Indonesia, Malaysia, and Global jurisdictions with direct portfolio company links.",
  },
  {
    href: "/learn",
    icon: BookOpen,
    name: "Learn",
    color: "text-teal-400",
    bg: "bg-teal-600/10 border-teal-600/20",
    description:
      "ESG knowledge repository for the Investment Group. 11 ESG frameworks (TCFD, TNFD, ISSB S1/S2, SASB, SBTi, EUDR, MAS GFAP, GRI, JETP/ETM, PCAF, UNGPs) across 5 categories (Climate, Nature, Reporting, Cross-cutting, Social) with investment relevance and ASEAN context. 6 ASEAN ESG case studies. Full-text search across frameworks and case studies simultaneously.",
  },
];

const aiFeatures = [
  { name: "IC Memo ESG Section", location: "Scout → Company Profile → Overview tab", description: "3-paragraph investment-grade ESG section for an IC memo, structured as Risk Summary / Value Uplift / Engagement Priorities." },
  { name: "ESG Action Plan", location: "Steward → Company card (expanded)", description: "12-month quarterly ESG engagement roadmap with specific KPIs and framework references." },
  { name: "Thematic Brief", location: "Signal → Megatrend detail page", description: "600-word investment-grade thematic brief across four structured sections (Why Now / Risks / Opportunities / Portfolio Implications)." },
  { name: "Portfolio ESG Brief", location: "Overview → below company table", description: "Quarterly portfolio-level ESG health summary covering aggregate trajectory, key risks, and value creation highlights across all active holdings." },
];

const stack = [
  { name: "Next.js 16 (App Router)", role: "Framework" },
  { name: "TypeScript", role: "Type safety" },
  { name: "Tailwind CSS v4", role: "Styling" },
  { name: "Recharts", role: "Data visualisation" },
  { name: "Google Gemini 2.5 Flash", role: "AI generation (free tier)" },
  { name: "Lucide React", role: "Icons" },
  { name: "Vercel", role: "Deployment" },
];

export default function AboutPage() {
  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="About Catalyst"
        subtitle="A prototype ESG Investment Intelligence platform — concept demo for Temasek's ESG Investment Management team."
      />

      {/* Investment Workflow Coverage */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-white mb-1">Investment Workflow Coverage</h2>
        <p className="text-xs text-slate-500 mb-3">Catalyst maps the end-to-end ESG investment workflow — from deal evaluation and risk assessment through post-investment engagement, thematic research, and portfolio reporting.</p>
        <div className="bg-[#0d1526] rounded-xl border border-white/5 p-5 space-y-3">
          {[
            { icon: Target, text: "ESG due diligence for new investment opportunities — risk management and value uplift lens" },
            { icon: ClipboardList, text: "Post-investment engagement monitoring with AI-generated 12-month ESG action plans" },
            { icon: BarChart2, text: "Thematic ESG research across megatrends with AI-generated investment briefs" },
            { icon: BookOpen, text: "ESG knowledge repository — frameworks, guidelines, and case studies for the Investment Group" },
            { icon: BarChart2, text: "Portfolio-level ESG health summaries for internal review — copyable formatted document" },
            { icon: Cpu, text: "Practical AI integration across four distinct investment workflow use cases" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <Icon className="w-4 h-4 flex-shrink-0 text-purple-400" />
              <p className="text-sm text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-white mb-3">Five Modules</h2>
        <div className="space-y-3">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`flex items-start gap-4 bg-[#0d1526] rounded-xl border p-4 hover:opacity-90 transition-opacity ${m.bg}`}
            >
              <div className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 ${m.color}`}>
                <m.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${m.color}`}>{m.name}</span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* AI Features */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-white mb-1">Four AI Features</h2>
        <p className="text-xs text-slate-500 mb-3">All powered by Google Gemini 2.5 Flash. Requires <code className="text-purple-400 bg-purple-500/10 px-1 rounded">GEMINI_API_KEY</code> in <code className="text-slate-300 bg-white/5 px-1 rounded">.env.local</code></p>
        <div className="grid grid-cols-2 gap-3">
          {aiFeatures.map((f) => (
            <div key={f.name} className="bg-[#0d1526] rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-sm font-medium text-white">{f.name}</span>
              </div>
              <div className="text-xs text-slate-500 mb-2">{f.location}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio data */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-white mb-3">Mock Portfolio ({companies.length} Companies)</h2>
        <div className="bg-[#0d1526] rounded-xl border border-white/5 p-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {companies.map((co) => (
              <div key={co.slug} className={`p-2 rounded-lg border ${co.portfolioStatus === "Pipeline" ? "border-blue-500/20 bg-blue-500/5" : "border-white/5 bg-white/[0.02]"}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {co.portfolioStatus === "Pipeline" && <GitMerge className="w-3 h-3 text-blue-400" />}
                  <span className="font-medium text-white">{co.name}</span>
                </div>
                <div className="text-slate-500">{co.sector}, {co.country}</div>
                <div className="text-slate-600 mt-0.5">{companyWhy[co.slug] ?? ""}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer — candidate context */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 mb-6">
        <p className="text-xs text-slate-500 leading-relaxed">
          Catalyst is a candidate portfolio project for Temasek&apos;s ESG Investment Management team. It is not an official Temasek product.
          All portfolio company data is mock and for demonstration purposes only.
          AI features use Google Gemini 2.5 Flash (free tier) and require a personal API key in <code className="text-slate-400 bg-white/5 px-1 rounded">.env.local</code>.
        </p>
      </div>

      {/* Tech stack */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-white mb-3">Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {stack.map((s) => (
            <div key={s.name} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <span className="text-xs text-white font-medium">{s.name}</span>
              <span className="text-xs text-slate-500 ml-1.5">{s.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-600 border-t border-white/5 pt-4">
        Built with Next.js 16, Tailwind CSS v4, and Gemini AI · 2026
      </div>
    </div>
  );
}
