import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { verifyAdminRequest } from "@/lib/adminAuth";

const ALLOWED_TYPES = ["deal_memo", "action_plan", "thematic_brief", "portfolio_brief", "engagement_questions"] as const;
type GenerationType = (typeof ALLOWED_TYPES)[number];

// Strip HTML-injection chars, collapse line endings, and remove all control chars
// (incl. null byte, tab used as TSV separator, U+2028/U+2029 JS line terminators)
const CTRL_RE = new RegExp("[\\x00-\\x09\\x0B\\x0C\\x0E-\\x1F\\x7F\\xA0\\u2028\\u2029]", "g");

function sanitize(value: unknown, maxLen = 200): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .slice(0, maxLen)
    .replace(/[<>]/g, "")
    .replace(/[\r\n]+/g, " ")
    .replace(CTRL_RE, "");
}

function sanitizeBlock(value: unknown, maxLen = 5000): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .slice(0, maxLen)
    .replace(/[<>]/g, "")
    .replace(/[\r\n]+/g, " ")
    .replace(CTRL_RE, "");
}

function validateContext(type: GenerationType, ctx: Record<string, unknown>): boolean {
  if (type === "deal_memo") {
    const strOk = ["name", "sector", "country", "rating", "maturity"].every((k) => typeof ctx[k] === "string" && (ctx[k] as string).trim().length > 0);
    // Require numeric scores — reject objects, booleans, arrays which produce "[object Object]" or "false" in the prompt
    const numOk = ["overallScore", "eScore", "sScore", "gScore"].every((k) => {
      const v = ctx[k];
      return (typeof v === "number" && isFinite(v)) || (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)));
    });
    return strOk && numOk;
  }
  if (type === "action_plan") {
    return ["name", "sector", "maturity", "country"].every((k) => typeof ctx[k] === "string" && (ctx[k] as string).trim().length > 0);
  }
  if (type === "thematic_brief") {
    return ["theme", "subtitle", "temasekAlignment"].every((k) => typeof ctx[k] === "string" && (ctx[k] as string).trim().length > 0);
  }
  if (type === "portfolio_brief") {
    return typeof ctx.portfolioSummary === "string" && ctx.portfolioSummary.trim().length > 0;
  }
  if (type === "engagement_questions") {
    // Required: name/sector/maturity/country (structural); transitionRisk/natureRisk (risk context)
    const required = ["name", "sector", "maturity", "country", "transitionRisk", "natureRisk"];
    return required.every((k) => typeof ctx[k] === "string" && (ctx[k] as string).trim().length > 0);
  }
  return false;
}

export async function POST(req: NextRequest) {
  // Require admin auth — Gemini calls consume API quota and must not be accessible anonymously.
  if (!verifyAdminRequest(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Same-origin check retained as defence-in-depth against CSRF from a different admin session.
  // Use explicit allowlist (NOT the attacker-controllable Host header, NOT prefix matches).
  const origin = req.headers.get("origin") ?? "";
  const referer = req.headers.get("referer") ?? "";
  // Extract origin from a full Referer URL (Referer includes path; Origin does not)
  const refererOrigin = referer ? (() => { try { const u = new URL(referer); return `${u.protocol}//${u.host}`; } catch { return ""; } })() : "";
  // Exact domain allowlist — prefix matching removed to prevent any attacker-registered
  // catalyst-neon-eight-* Vercel project from bypassing this guard.
  const isAllowed = (s: string) =>
    s === "https://catalyst-neon-eight.vercel.app" ||
    (process.env.NODE_ENV !== "production" && (s === "http://localhost:3000" || s === "http://localhost:3001"));
  const hasSourceHeader = origin !== "" || referer !== "";
  const sameOrigin = isAllowed(origin) || isAllowed(refererOrigin);
  if (!hasSourceHeader || !sameOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI generation is not available — contact your administrator" },
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
    let systemInstruction = "";
    let userContent = "";

    if (type === "deal_memo") {
      systemInstruction = `You are a senior ESG analyst at Temasek, a Singapore sovereign wealth fund.
Write a concise 3-paragraph ESG section for an investment committee memo.
Write exactly three paragraphs:
1. ESG Risk Summary: Key material ESG risks and their financial materiality to the investment
2. Value Uplift Opportunities: Top 2-3 ESG-linked value creation levers
3. Engagement & Monitoring: Recommended post-investment ESG action priorities
Write in the style of a Temasek investment memo — precise, investment-grade, Singapore/Asia context-aware. No headers, just three paragraphs. Use frameworks like TCFD, TNFD, ISSB, and SASB appropriately. Reference "sustainable returns over the long term" and Temasek's mandate where relevant.`;
      userContent = `Company: ${sanitize(ctx.name)}
Sector: ${sanitize(ctx.sector)}${ctx.sasbCategory ? ` (${sanitize(ctx.sasbCategory)})` : ""}
Country/Region: ${sanitize(ctx.country)}, ${sanitize(ctx.region)}
ESG Rating: ${sanitize(ctx.rating)} (Overall score: ${sanitize(ctx.overallScore)}/100, E: ${sanitize(ctx.eScore)}, S: ${sanitize(ctx.sScore)}, G: ${sanitize(ctx.gScore)})
ESG Maturity: ${sanitize(ctx.maturity)}
Climate Risk: Physical ${sanitize(ctx.physicalRisk)}, Transition ${sanitize(ctx.transitionRisk)} | Pathway: ${sanitize(ctx.pathway)}
Transition Risk Context: ${sanitize(ctx.transitionContext, 400)}
Nature Risk: ${sanitize(ctx.natureRisk)}
Top Material Issues: ${sanitize(ctx.topIssues, 500)}
Key Value Uplift: ${sanitize(ctx.topUplift, 300)}
Carbon Intensity: ${sanitize(ctx.carbonIntensity)} tCO2e/$M revenue
Green Revenue: ${sanitize(ctx.greenRevenuePct)}% of total revenue${ctx.icVerdict ? `\nIC Recommendation: ${sanitize(ctx.icVerdict)}${ctx.icEsgGating ? ` | ESG Gating: ${sanitize(ctx.icEsgGating)}` : ""}${ctx.icConditions ? ` | Conditions: ${sanitize(ctx.icConditions, 300)}` : ""}` : ""}`;
    } else if (type === "action_plan") {
      systemInstruction = `You are a senior ESG engagement specialist at Temasek.
Generate a 12-month ESG Action Plan for the portfolio company described in the user message.
Structure the plan as follows:
- Q1 (Months 1-3): Foundation & Assessment (2-3 actions with specific KPIs)
- Q2 (Months 4-6): Implementation Begins (2-3 actions with specific KPIs)
- Q3 (Months 7-9): Scale & Embed (2-3 actions with specific KPIs)
- Q4 (Months 10-12): Report & Review (2-3 actions with specific KPIs)
Each action should be specific, measurable, and time-bound. Reference relevant frameworks (TCFD, TNFD, ISSB, SASB, SBTi, etc.). Focus on the highest-impact interventions aligned with Temasek's ESG investment thesis. Be direct and investment-grade in tone.`;
      userContent = `Company: ${sanitize(ctx.name)}
Sector: ${sanitize(ctx.sector)}
Country/Jurisdiction: ${sanitize(ctx.country)}
ESG Maturity: ${sanitize(ctx.maturity)}
ESG Score: ${sanitize(ctx.esgScore)}
Transition Risk: ${sanitize(ctx.transitionRisk)}
Carbon Intensity: ${sanitize(ctx.carbonIntensity)}
Green Revenue: ${sanitize(ctx.greenRevenuePct)}
Net Zero Commitment: ${sanitize(ctx.netZeroCommitment)}
Overdue Engagements: ${sanitize(ctx.overdueEngagements, 300)}
Top Issues: ${sanitize(ctx.topIssues, 500)}
Key Gaps: ${sanitizeBlock(ctx.keyGaps, 500)}
Key Value Uplift Opportunities: ${sanitize(ctx.topUplift, 300)}`;
    } else if (type === "thematic_brief") {
      systemInstruction = `You are a senior sustainability strategist at Temasek's Sustainability Group.
Write a 600-word investment-grade thematic brief on the ESG megatrend described in the user message.
Structure:
1. Why This Matters Now (150 words): The investment case — why this theme is urgent and financially material
2. Key Risks (150 words): 2-3 specific risks for portfolio companies and deal pipelines
3. Key Opportunities (150 words): 2-3 specific investment or engagement opportunities
4. Temasek Portfolio Implications (150 words): Specific implications for our Asia/ASEAN portfolio companies
Write in the voice of Temasek's Sustainability Group — sophisticated, Asia-aware, investment-grade. Reference Temasek's mandate of "so every generation prospers" and "sustainable returns over the long term." Cite specific frameworks and data where relevant. No headers — flowing paragraphs.`;
      userContent = `Theme: ${sanitize(ctx.theme)}
Subtitle: ${sanitize(ctx.subtitle)}
Temasek alignment: ${sanitize(ctx.temasekAlignment)}
Key frameworks: ${sanitize(ctx.frameworks, 400)}
Portfolio exposure: ${sanitizeBlock(ctx.portfolioExposure, 400)}`;
    } else if (type === "portfolio_brief") {
      systemInstruction = `You are the Head of ESG Investment Management at Temasek, Singapore's sovereign wealth fund.
Write a concise Portfolio ESG Health Summary for the most recent quarter, based on the portfolio data in the user message.
Write exactly 3 paragraphs:
1. Portfolio ESG Performance: Aggregate ESG trajectory, top improvers, and companies requiring attention. Reference specific score movements and drivers.
2. Key Risks & Escalations: The 2-3 most material ESG risks across the portfolio this quarter — include regulatory, physical climate, transition, and nature-related risks. Call out any overdue engagement commitments.
3. ESG Value Creation Highlights: Concrete value uplift achievements and upcoming opportunities — green financing, engagement milestones, and pipeline evaluation progress.
Write for an internal quarterly portfolio review — investment-grade, specific, and action-oriented. Reference TCFD, TNFD, ISSB, and Temasek's mandate. Use company names. No headers.`;
      userContent = `Portfolio Summary:\n${sanitizeBlock(ctx.portfolioSummary, 5000)}`;
    } else if (type === "engagement_questions") {
      systemInstruction = `You are a senior ESG Engagement Specialist at Temasek, preparing for a stewardship meeting.
Generate exactly 12 targeted due diligence questions for the portfolio company described in the user message, organized into 4 sections:
**Section 1 — Climate & Net Zero (3 questions)**
Questions about transition plan specifics, capital allocation, and pathway validation. Reference TCFD, ISSB S2, SBTi as appropriate.
**Section 2 — Nature & Supply Chain (3 questions)**
Questions about TNFD LEAP progress, supply chain traceability (EUDR where relevant), biodiversity risk management.
**Section 3 — Social & Governance (3 questions)**
Questions about board ESG oversight, UNGP HRDD, just transition plans for affected workers, labour practices.
**Section 4 — Regulatory & Reporting Readiness (3 questions)**
Questions about ISSB S1/S2 readiness, relevant Singapore/ASEAN regulatory compliance (MAS, SGX, OJK), data assurance plans.
For each question: make it specific to this company's profile, not generic. Reference actual risks identified. Frame as questions an institutional investor would ask in an engagement meeting.
Format: Numbered list within each section. Investment-grade language. Singapore/ASEAN context-aware.`;
      userContent = `Company: ${sanitize(ctx.name)}
Sector: ${sanitize(ctx.sector)}
Country: ${sanitize(ctx.country)}
ESG Maturity: ${sanitize(ctx.maturity)}
Transition Risk Level: ${sanitize(ctx.transitionRisk)}
Physical Risk Level: ${sanitize(ctx.physicalRisk)}
Physical Risk Context: ${sanitize(ctx.physicalContext, 300)}
Nature Risk Level: ${sanitize(ctx.natureRisk)}
Pathway Alignment: ${sanitize(ctx.pathway)}
Net Zero Commitment: ${sanitize(ctx.commitment)}
Top Material Issues: ${sanitize(ctx.topIssues, 400)}
Overdue Engagements: ${sanitize(ctx.overdueEngagements, 300)}
Key Regulatory Pressures: ${sanitize(ctx.regulatoryContext, 300)}`;
    }

    if (!userContent) {
      return NextResponse.json({ error: "Prompt construction failed for this generation type" }, { status: 500 });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    let text: string | undefined;
    text = response.text;
    // Check for truncated responses — MAX_TOKENS finishReason means partial output
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === "MAX_TOKENS") {
      return NextResponse.json({ error: "AI response was truncated — the request may be too long. Please try again." }, { status: 502 });
    }
    if (!text?.trim()) {
      return NextResponse.json({ error: "No content returned from AI (response may have been filtered)" }, { status: 502 });
    }
    // Strip markdown code fence lines (``` with optional language tag) wherever they appear.
    // Handles preamble-before-fence, multiple blocks, and doesn't clip actual content
    // since well-formed prose never has a line that is purely triple-backticks.
    const stripped = text.replace(/^```[a-z]*\s*$/gim, "").trim();
    return NextResponse.json({ text: stripped });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const safe = message.length > 200 ? message.slice(0, 200) + "…" : message;
    // Detect specific API error types; only flag as auth (400) on explicit key errors
    const isRateLimit = /\b429\b/.test(message) || message.toLowerCase().includes("quota") || message.toLowerCase().includes("exhausted") || message.toLowerCase().includes("rate limit");
    const isOverload = /\b503\b/.test(message) || message.toLowerCase().includes("unavailable") || message.toLowerCase().includes("overloaded");
    const isAuthError = message.toLowerCase().includes("api_key_invalid") || message.toLowerCase().includes("invalid api key");
    const status = isRateLimit ? 429 : isOverload ? 503 : isAuthError ? 401 : 500;
    return NextResponse.json({ error: safe }, { status });
  }
}
