import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ALLOWED_TYPES = ["deal_memo", "action_plan", "thematic_brief", "portfolio_brief", "engagement_questions"] as const;
type GenerationType = (typeof ALLOWED_TYPES)[number];

function sanitize(value: unknown, maxLen = 200): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .slice(0, maxLen)
    .replace(/[<>]/g, "")
    .replace(/[\r\n]+/g, " ");
}

function sanitizeBlock(value: unknown, maxLen = 5000): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .slice(0, maxLen)
    .replace(/[<>]/g, "")
    .replace(/[\r\n]+/g, " ");
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
  if (type === "engagement_questions") {
    return ["name", "sector", "maturity", "country"].every((k) => typeof ctx[k] === "string");
  }
  return false;
}

export async function POST(req: NextRequest) {
  // Restrict to same-origin requests — blocks external quota-abuse scripting.
  // Require at least one of Origin or Referer header; reject if neither present
  // (headless scripts commonly omit both; browsers always send at least one).
  const origin = req.headers.get("origin") ?? "";
  const referer = req.headers.get("referer") ?? "";
  const host = req.headers.get("host") ?? "";
  const allowedOrigins = [
    `https://${host}`,
    "http://localhost:3000",
    "http://localhost:3001",
  ];
  const hasSourceHeader = origin !== "" || referer !== "";
  const sameOrigin = allowedOrigins.some(o => origin.startsWith(o) || referer.startsWith(o));
  if (!hasSourceHeader || !sameOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured. Add GEMINI_API_KEY to .env.local" },
      { status: 503 }
    );
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body — expected JSON" }, { status: 400 });
    }
    const type = (body as Record<string, unknown>)?.type;
    const context = (body as Record<string, unknown>)?.context;

    if (!ALLOWED_TYPES.includes(type as GenerationType)) {
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
Transition Risk Context: ${sanitize(ctx.transitionContext, 400)}
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
Key Gaps: ${sanitizeBlock(ctx.keyGaps, 500)}

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
Portfolio exposure: ${sanitizeBlock(ctx.portfolioExposure, 400)}

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
${sanitizeBlock(ctx.portfolioSummary, 5000)}

Write exactly 3 paragraphs:
1. Portfolio ESG Performance: Aggregate ESG trajectory, top improvers, and companies requiring attention. Reference specific score movements and drivers.
2. Key Risks & Escalations: The 2-3 most material ESG risks across the portfolio this quarter — include regulatory, physical climate, transition, and nature-related risks. Call out any overdue engagement commitments.
3. ESG Value Creation Highlights: Concrete value uplift achievements and upcoming opportunities — green financing, engagement milestones, and pipeline evaluation progress.

Write for an internal quarterly portfolio review — investment-grade, specific, and action-oriented. Reference TCFD, TNFD, ISSB, and Temasek's mandate. Use company names. No headers.`;
    } else if (type === "engagement_questions") {
      prompt = `You are a senior ESG Engagement Specialist at Temasek, preparing for a stewardship meeting with a portfolio company.

Company: ${sanitize(ctx.name)}
Sector: ${sanitize(ctx.sector)}
Country: ${sanitize(ctx.country)}
ESG Maturity: ${sanitize(ctx.maturity)}
Transition Risk Level: ${sanitize(ctx.transitionRisk)}
Nature Risk Level: ${sanitize(ctx.natureRisk)}
Pathway Alignment: ${sanitize(ctx.pathway)}
Net Zero Commitment: ${sanitize(ctx.commitment)}
Top Material Issues: ${sanitize(ctx.topIssues, 400)}
Overdue Engagements: ${sanitize(ctx.overdueEngagements, 300)}
Key Regulatory Pressures: ${sanitize(ctx.regulatoryContext, 300)}

Generate exactly 12 targeted due diligence questions for this company engagement, organized into 4 sections:

**Section 1 — Climate & Net Zero (3 questions)**
Questions about transition plan specifics, capital allocation, and pathway validation. Reference TCFD, ISSB S2, SBTi as appropriate.

**Section 2 — Nature & Supply Chain (3 questions)**
Questions about TNFD LEAP progress, supply chain traceability (EUDR where relevant), biodiversity risk management.

**Section 3 — Social & Governance (3 questions)**
Questions about board ESG oversight, UNGP HRDD, just transition plans for affected workers, labour practices.

**Section 4 — Regulatory & Reporting Readiness (3 questions)**
Questions about ISSB S1/S2 readiness, relevant Singapore/ASEAN regulatory compliance (MAS, SGX, OJK), data assurance plans.

For each question: make it specific to this company's profile, not generic. Reference actual risks identified above. Frame as questions an institutional investor would ask in an engagement meeting.

Format: Numbered list within each section. Investment-grade language. Singapore/ASEAN context-aware.`;
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt construction failed for this generation type" }, { status: 500 });
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
    if (!text?.trim()) {
      return NextResponse.json({ error: "No content returned from AI (response may have been filtered)" }, { status: 502 });
    }
    return NextResponse.json({ text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const safe = message.length > 200 ? message.slice(0, 200) + "…" : message;
    // Detect specific API error types to return appropriate HTTP status codes
    const isRateLimit = /\b429\b/.test(message) || message.toLowerCase().includes("quota") || message.toLowerCase().includes("exhausted") || message.toLowerCase().includes("rate limit");
    const isOverload = /\b503\b/.test(message) || message.toLowerCase().includes("unavailable") || message.toLowerCase().includes("overloaded");
    const isAuthError = /\b400\b/.test(message) || message.toLowerCase().includes("api_key_invalid") || message.toLowerCase().includes("invalid api key");
    const status = isRateLimit ? 429 : isOverload ? 503 : isAuthError ? 400 : 500;
    return NextResponse.json({ error: safe }, { status });
  }
}
