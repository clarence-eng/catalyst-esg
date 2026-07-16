import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabase";

// In-memory rate limiter — 30 write requests per minute per IP on this lambda instance.
// Resets on cold-start; provides blast-radius reduction if a stolen cookie is used for bulk deletes.
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    // Evict all expired entries periodically to prevent unbounded memory growth
    // on long-lived container instances with many unique IPs.
    if (rateLimitMap.size > 500) {
      for (const [k, v] of rateLimitMap) {
        if (now > v.reset) rateLimitMap.delete(k);
      }
    }
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

type WriteBody =
  | { action: "upsert_company"; company: Record<string, unknown> }
  | { action: "delete_company"; id: string; slug: string }
  | { action: "upsert_engagement"; engagement: Record<string, unknown>; company_slug: string }
  | { action: "delete_engagement"; id: string; company_slug: string }
  | { action: "upsert_issue"; issue: Record<string, unknown>; company_slug: string }
  | { action: "delete_issue"; id: string; company_slug: string };

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

function sanitizeString(v: unknown, max = 500): string {
  if (v === null || v === undefined) return "";
  return String(v).slice(0, max).replace(/[<>]/g, "");
}

function coerceNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isFinite(n) ? n : fallback;
}

export async function POST(req: NextRequest) {
  if (!verifyAdminRequest(req)) return forbidden();

  // x-real-ip is set by the edge proxy and is trustworthy.
  // x-forwarded-for is a comma-list; the leftmost entry is the original client IP — use that.
  // The rightmost entry is the last proxy which can be forged by the client.
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests — please wait before retrying" }, { status: 429 });
  }

  let body: WriteBody;
  try { body = await req.json() as WriteBody; } catch {
    return badRequest("Invalid JSON");
  }

  const sb = getSupabaseAdminClient();

  if (body.action === "upsert_company") {
    const co = body.company;
    const name = sanitizeString(co.name, 200).trim();
    const slug = sanitizeString(co.slug, 100).trim();
    const sector = sanitizeString(co.sector, 200).trim();
    const country = sanitizeString(co.country, 200).trim();
    const description = sanitizeString(co.description, 5000).trim();
    if (!name || !slug || !sector || !country || !description)
      return badRequest("name, slug, sector, country, description required");
    if (!SLUG_RE.test(slug)) return badRequest("Invalid slug format");
    const VALID_STATUSES = ["Active", "Pipeline"];
    const VALID_MATURITY = ["Leading", "Advanced", "Developing", "Lagging"];
    const VALID_RISK = ["Low", "Medium", "High", "Critical"];
    const VALID_PATHWAY = ["1.5°C", "2°C", "3°C+", "Not assessed"];
    const VALID_NZC = ["None", "Net Zero Pledged", "SBTi Committed", "SBTi Targets Set"];
    const VALID_RATING = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC"];
    const VALID_REGION = ["Southeast Asia", "Asia Pacific", "South Asia", "Global"];
    const VALID_MEGATREND = ["Climate Transition", "Nature & Biodiversity", "Just Transition & Inclusive Growth", "AI & Digital Ethics", "Longer Lifespans"];
    const portfolio_status = VALID_STATUSES.includes(String(co.portfolio_status)) ? String(co.portfolio_status) : "Active";
    const maturity = VALID_MATURITY.includes(String(co.maturity)) ? String(co.maturity) : "Developing";
    const transition_risk = VALID_RISK.includes(String(co.transition_risk)) ? String(co.transition_risk) : "Medium";
    const physical_risk = VALID_RISK.includes(String(co.physical_risk)) ? String(co.physical_risk) : "Low";
    const nature_risk = VALID_RISK.includes(String(co.nature_risk)) ? String(co.nature_risk) : "Low";
    const pathway_alignment = VALID_PATHWAY.includes(String(co.pathway_alignment)) ? String(co.pathway_alignment) : "Not assessed";
    const net_zero_commitment = VALID_NZC.includes(String(co.net_zero_commitment)) ? String(co.net_zero_commitment) : "None";
    const esg_rating = VALID_RATING.includes(String(co.esg_rating)) ? String(co.esg_rating) : "BBB";
    const region = VALID_REGION.includes(String(co.region)) ? String(co.region) : "Southeast Asia";
    const temasek_megatrend = VALID_MEGATREND.includes(String(co.temasek_megatrend)) ? String(co.temasek_megatrend) : "Climate Transition";
    const esg_overall = Math.min(100, Math.max(0, coerceNumber(co.esg_overall)));
    const esg_environmental = Math.min(100, Math.max(0, coerceNumber(co.esg_environmental)));
    const esg_social = Math.min(100, Math.max(0, coerceNumber(co.esg_social)));
    const esg_governance = Math.min(100, Math.max(0, coerceNumber(co.esg_governance)));
    const carbon_intensity = Math.max(0, coerceNumber(co.carbon_intensity));
    const green_revenue_pct = Math.min(100, Math.max(0, coerceNumber(co.green_revenue_pct)));
    const investment_value = coerceNumber(co.investment_value);
    if (investment_value < 0) return badRequest("investmentValue must be 0 or greater");
    // Active holdings must have positive investment value; Pipeline companies may be 0 (no committed capital yet)
    if (portfolio_status === "Active" && investment_value <= 0) return badRequest("investmentValue must be greater than 0 for Active companies");
    const sasb_category = sanitizeString(co.sasb_category, 200).trim();
    const last_updated = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Singapore" });
    const payload = {
      name, slug, sector, country, description, portfolio_status, maturity,
      transition_risk, physical_risk, nature_risk, pathway_alignment,
      net_zero_commitment, esg_rating, region, temasek_megatrend,
      esg_overall, esg_environmental, esg_social, esg_governance,
      carbon_intensity, green_revenue_pct, investment_value, sasb_category, last_updated,
    };
    const id = typeof co.id === "string" && co.id.trim() ? co.id.trim() : null;
    if (id) {
      // Verify slug is not being changed — slug is immutable after creation (child rows are keyed on it)
      const { data: existing } = await sb.from("companies").select("slug").eq("id", id).single();
      if (!existing) return badRequest("Company not found");
      if (existing.slug !== slug) return badRequest("Slug is immutable — child records are keyed on the original slug. Create a new company instead of renaming.");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { slug: _slug, ...updatePayload } = payload;
      const { error } = await sb.from("companies").update(updatePayload).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await sb.from("companies").insert(payload);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete_company") {
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!id || !slug) return badRequest("id and slug required");
    // Verify id and slug belong to the same row to prevent cross-company child deletion
    const { data: check } = await sb.from("companies").select("id").eq("id", id).eq("slug", slug).single();
    if (!check) return badRequest("id/slug mismatch — company not found");
    // Delete children first; bail before touching the company row if either child delete fails.
    // This prevents permanent orphan data loss: if children succeed but the company DELETE later
    // fails, a retry would delete the company row while its children are already gone.
    const { error: miErr } = await sb.from("material_issues").delete().eq("company_slug", slug);
    if (miErr) return NextResponse.json({ error: miErr.message }, { status: 500 });
    const { error: engErr } = await sb.from("engagements").delete().eq("company_slug", slug);
    if (engErr) return NextResponse.json({ error: engErr.message }, { status: 500 });
    const { error: coErr } = await sb.from("companies").delete().eq("id", id);
    if (coErr) return NextResponse.json({ error: coErr.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "upsert_engagement") {
    const e = body.engagement;
    const company_slug = typeof body.company_slug === "string" ? body.company_slug.trim() : "";
    if (!company_slug || !SLUG_RE.test(company_slug)) return badRequest("Invalid company_slug");
    const { count: coCount } = await sb.from("companies").select("id", { count: "exact", head: true }).eq("slug", company_slug);
    if (!coCount) return badRequest("Company not found");
    const date = typeof e.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date) ? e.date : "";
    if (!date) return badRequest("Valid date required");
    const topic = sanitizeString(e.topic, 500).trim();
    if (!topic) return badRequest("topic required");
    const VALID_TYPE = ["Meeting", "Call", "Email", "Report Review", "Site Visit"];
    const VALID_STATUS = ["Completed", "Planned", "Overdue"];
    const type = VALID_TYPE.includes(String(e.type)) ? String(e.type) : "Meeting";
    const status = VALID_STATUS.includes(String(e.status)) ? String(e.status) : "Planned";
    const notes = sanitizeString(e.notes, 2000);
    const payload = { company_slug, date, type, topic, status, notes };
    const id = typeof e.id === "string" && e.id.trim() ? e.id.trim() : null;
    if (id) {
      const { error, count } = await sb.from("engagements").update({ date, type, topic, status, notes }, { count: "exact" }).eq("id", id).eq("company_slug", company_slug);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!count) return NextResponse.json({ error: "Engagement not found or does not belong to this company" }, { status: 404 });
    } else {
      const { error } = await sb.from("engagements").insert(payload);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete_engagement") {
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const company_slug = typeof body.company_slug === "string" ? body.company_slug.trim() : "";
    if (!id) return badRequest("id required");
    if (!company_slug || !SLUG_RE.test(company_slug)) return badRequest("company_slug required");
    const { error, count } = await sb.from("engagements").delete({ count: "exact" }).eq("id", id).eq("company_slug", company_slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!count) return NextResponse.json({ error: "Engagement not found or does not belong to this company" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "upsert_issue") {
    const i = body.issue;
    const company_slug = typeof body.company_slug === "string" ? body.company_slug.trim() : "";
    if (!company_slug || !SLUG_RE.test(company_slug)) return badRequest("Invalid company_slug");
    const { count: coCount2 } = await sb.from("companies").select("id", { count: "exact", head: true }).eq("slug", company_slug);
    if (!coCount2) return badRequest("Company not found");
    const issue = sanitizeString(i.issue, 500).trim();
    if (!issue) return badRequest("issue name required");
    const VALID_SEV = ["Critical", "High", "Medium", "Low"];
    const VALID_CAT = ["Environmental", "Social", "Governance"];
    const severity = VALID_SEV.includes(String(i.severity)) ? String(i.severity) : "Medium";
    const category = VALID_CAT.includes(String(i.category)) ? String(i.category) : "Environmental";
    const opportunity = Boolean(i.opportunity);
    const detail = sanitizeString(i.detail, 2000);
    const sort_order = coerceNumber(i.sort_order, 0);
    const payload = { company_slug, issue, severity, category, opportunity, detail, sort_order };
    const id = typeof i.id === "string" && i.id.trim() ? i.id.trim() : null;
    if (id) {
      const { error, count } = await sb.from("material_issues").update({ issue, severity, category, opportunity, detail, sort_order }, { count: "exact" }).eq("id", id).eq("company_slug", company_slug);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!count) return NextResponse.json({ error: "Issue not found or does not belong to this company" }, { status: 404 });
    } else {
      const { error } = await sb.from("material_issues").insert(payload);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete_issue") {
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const company_slug = typeof body.company_slug === "string" ? body.company_slug.trim() : "";
    if (!id) return badRequest("id required");
    if (!company_slug || !SLUG_RE.test(company_slug)) return badRequest("company_slug required");
    const { error, count } = await sb.from("material_issues").delete({ count: "exact" }).eq("id", id).eq("company_slug", company_slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!count) return NextResponse.json({ error: "Issue not found or does not belong to this company" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  return badRequest("Unknown action");
}
