import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const ALLOWED_TYPES = ["deal_memo", "action_plan", "thematic_brief", "portfolio_brief"] as const;
type GenerationType = (typeof ALLOWED_TYPES)[number];

function sanitize(value: unknown, maxLen = 200): string {
  if (value === null || value === undefined) return "";
  return String(value).slice(0, maxLen).replace(/[<>]/g, "");
}

function validateContext(type: GenerationType, ctx: Record<string, unknown>): boolean {
  if (type === "deal_memo") {
    return ["name", "sector", "country", "rating", "maturity"].every((k) => typeof ctx[k] === "string");
  }
  if (type === "action_plan") {
    return ["name", "sector", "maturity"].every((k) => typeof ctx[k] === "string");
  }
  if (type === "thematic_brief") {
    return ["theme", "subtitle", "temasekAlignment"].every((k) => typeof ctx[k] === "string");
  }
  if (type === "portfolio_brief") {
    return typeof ctx.portfolioSummary === "string" && ctx.portfolioSummary.trim().length > 0;
  }
  return false;
}

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured. Add GEMINI_API_KEY to .env.local" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const type = body?.type;
    const context = body?.context;

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: "Unknown generation type" }, { status: 400 });
    }
    if (!context || typeof context !== "object") {
      return NextResponse.json({ error: "Invalid context" }, { status: 400 });
    }
    if (!validateContext(type as GenerationType, context as Record<string, unknown>)) {
      return NextResponse.json({ error: "Missing required context fields" }, { status: 400 });
    }

    const ctx = context as Record<string, unknown>;
    let prompt = "";

    if (type === "deal_memo") {
      prompt = `You are a senior ESG analyst at Temasek, a Singapore sovereign wealth fund.
Write a concise 3-paragraph ESG section for an investment committee memo for the following company.

Company: ${sanitize(ctx.name)}
Sector: ${sanitize(ctx.sector)} (${sanitize(ctx.sasbCategory)})
Country/Region: ${sanitize(ctx.country)}, ${sanitize(ctx.region)}
ESG Rating: ${sanitize(ctx.rating)} (Overall score: ${sanitize(ctx.overallScore)}/100, E: ${sanitize(ctx.eScore)}, S: ${sanitize(ctx.sScore)}, G: ${sanitize(ctx.gScore)})
ESG Maturity: ${sanitize(ctx.maturity)}
Climate Risk: Physical ${sanitize(ctx.physicalRisk)}, Transition ${sanitize(ctx.transitionRisk)} | Pathway: ${sanitize(ctx.pathway)}
Nature Risk: ${sanitize(ctx.natureRisk)}
Top Material Issues: ${sanitize(ctx.topIssues, 500)}
Key Value Uplift: ${sanitize(ctx.topUplift, 300)}
Carbon Intensity: ${sanitize(ctx.carbonIntensity)} tCO2e/$M revenue
Green Revenue: ${sanitize(ctx.greenRevenuePct)}% of total revenue

Write exactly three paragraphs:
1. ESG Risk Summary: Key material ESG risks and their financial materiality to the investment
2. Value Uplift Opportunities: Top 2-3 ESG-linked value creation levers
3. Engagement & Monitoring: Recommended post-investment ESG action priorities

Write in the style of a Temasek investment memo — precise, investment-grade, Singapore/Asia context-aware. No headers, just three paragraphs. Use frameworks like TCFD, TNFD, ISSB, and SASB appropriately. Reference "sustainable returns over the long term" and Temasek's mandate where relevant.`;
    } else if (type === "action_plan") {
      prompt = `You are a senior ESG engagement specialist at Temasek.
Generate a 12-month ESG Action Plan for the following portfolio company.

Company: ${sanitize(ctx.name)}
Sector: ${sanitize(ctx.sector)}
ESG Maturity: ${sanitize(ctx.maturity)}
Top Issues: ${sanitize(ctx.topIssues, 500)}
Key Gaps: ${sanitize(ctx.keyGaps, 500)}

Structure the plan as follows:
- Q1 (Months 1-3): Foundation & Assessment (2-3 actions with specific KPIs)
- Q2 (Months 4-6): Implementation Begins (2-3 actions with specific KPIs)
- Q3 (Months 7-9): Scale & Embed (2-3 actions with specific KPIs)
- Q4 (Months 10-12): Report & Review (2-3 actions with specific KPIs)

Each action should be specific, measurable, and time-bound. Reference relevant frameworks (TCFD, TNFD, ISSB, SASB, SBTi, etc.). Focus on the highest-impact interventions aligned with Temasek's ESG investment thesis. Be direct and investment-grade in tone.`;
    } else if (type === "thematic_brief") {
      prompt = `You are a senior sustainability strategist at Temasek's Sustainability Group.
Write a 600-word investment-grade thematic brief on the following ESG megatrend.

Theme: ${sanitize(ctx.theme)}
Subtitle: ${sanitize(ctx.subtitle)}
Temasek alignment: ${sanitize(ctx.temasekAlignment)}
Key frameworks: ${sanitize(ctx.frameworks, 400)}
Portfolio exposure: ${sanitize(ctx.portfolioExposure, 400)}

Structure:
1. Why This Matters Now (150 words): The investment case — why this theme is urgent and financially material
2. Key Risks (150 words): 2-3 specific risks for portfolio companies and deal pipelines
3. Key Opportunities (150 words): 2-3 specific investment or engagement opportunities
4. Temasek Portfolio Implications (150 words): Specific implications for our Asia/ASEAN portfolio companies

Write in the voice of Temasek's Sustainability Group — sophisticated, Asia-aware, investment-grade. Reference Temasek's mandate of "so every generation prospers" and "sustainable returns over the long term." Cite specific frameworks and data where relevant. No headers — flowing paragraphs.`;
    } else if (type === "portfolio_brief") {
      prompt = `You are the Head of ESG Investment Management at Temasek, Singapore's sovereign wealth fund.
Write a concise Portfolio ESG Health Summary for the most recent quarter.

Portfolio Summary:
${sanitize(ctx.portfolioSummary, 5000)}

Write exactly 3 paragraphs:
1. Portfolio ESG Performance: Aggregate ESG trajectory, top improvers, and companies requiring attention. Reference specific score movements and drivers.
2. Key Risks & Escalations: The 2-3 most material ESG risks across the portfolio this quarter — include regulatory, physical climate, transition, and nature-related risks. Call out any overdue engagement commitments.
3. ESG Value Creation Highlights: Concrete value uplift achievements and upcoming opportunities — green financing, engagement milestones, and pipeline evaluation progress.

Write for an internal quarterly portfolio review — investment-grade, specific, and action-oriented. Reference TCFD, TNFD, ISSB, and Temasek's mandate. Use company names. No headers.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text: string | undefined;
    try {
      text = response.text;
    } catch {
      return NextResponse.json({ error: "No content returned from AI (response may have been filtered)" }, { status: 502 });
    }
    if (!text) {
      return NextResponse.json({ error: "No content returned from AI (response may have been filtered)" }, { status: 502 });
    }
    return NextResponse.json({ text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
