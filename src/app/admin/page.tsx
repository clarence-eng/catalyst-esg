"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase, type DbCompany, type DbEngagement, type DbMaterialIssue } from "@/lib/supabase";
import { clearCache } from "@/lib/useCompanies";
import { Plus, Trash2, Edit3, Save, ChevronDown, ChevronUp, Lock, LogOut, Building2, Users, CheckCircle } from "lucide-react";

async function adminWrite(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/admin/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({})) as { error?: string };
    return { ok: false, error: data.error ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ─── Auth ───────────────────────────────────────────────────────────────────
function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [checking, setChecking] = useState(false);
  const check = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) { setAuthed(true); setErr(false); }
      else setErr(true);
    } catch { setErr(true); }
    finally { setChecking(false); }
  };
  return { authed, pw, setPw, err, check, checking, logout: async () => {
    try { await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" }); } catch { /* ignore */ }
    setAuthed(false);
  } };
}

// ─── Company Form ────────────────────────────────────────────────────────────
function todayISO() {
  // Use local calendar date, not UTC — avoids showing yesterday for UTC+8 users before 8am
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function makeEmptyCo(): Partial<DbCompany> {
  return {
    name: "", slug: "", sector: "", country: "", region: "Southeast Asia",
    description: "", portfolio_status: "Active", maturity: "Developing",
    investment_value: 100, carbon_intensity: 50, green_revenue_pct: 10,
    esg_overall: 55, esg_environmental: 55, esg_social: 55, esg_governance: 55,
    esg_rating: "BBB", transition_risk: "Medium", physical_risk: "Medium",
    pathway_alignment: "Not assessed", nature_risk: "Medium",
    net_zero_commitment: "None", sasb_category: "", temasek_megatrend: "Climate Transition",
    last_updated: todayISO(),
  };
}

function slugify(s: string) {
  // Normalize Unicode (NFD) then strip combining diacritical marks before slugifying
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Hoisted outside CoForm to prevent unmount/remount on every state update
function CoField({ label, k, type = "text", opts, co, set, required: isRequired }: {
  label: string; k: string; type?: string; opts?: string[]; required?: boolean;
  co: Partial<DbCompany>; set: (k: string, v: unknown) => void;
}) {
  const fieldId = `cofield-${k}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-xs font-medium text-gray-700">{label}</label>
      {opts ? (
        <select id={fieldId} aria-required={isRequired} value={(co as Record<string,unknown>)[k] as string || ""} onChange={e => set(k, e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30">
          {opts.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input id={fieldId} aria-required={isRequired} type={type} value={((co as Record<string,unknown>)[k] ?? "") as string}
          onChange={e => { const v = type === "number" ? (e.target.value === '' ? 0 : parseFloat(e.target.value) || 0) : e.target.value; set(k, v); if (k === "name" && !co.id) set("slug", slugify(e.target.value)); }}
          readOnly={k === "slug" && !!co.id}
          aria-readonly={k === "slug" && !!co.id || undefined}
          {...(type === "number" && k.startsWith("esg_") ? { min: 0, max: 100 } :
               type === "number" && k === "green_revenue_pct" ? { min: 0, max: 100 } :
               type === "number" && k === "carbon_intensity" ? { min: 0 } :
               type === "number" && k === "investment_value" ? { min: 0 } : {})}
          className={`border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 ${k === "slug" && co.id ? "bg-gray-50 text-gray-600 cursor-not-allowed" : "focus:border-purple-400"}`} />
      )}
    </div>
  );
}

function CoForm({ initial, onSave, onCancel }: { initial: Partial<DbCompany>; onSave: (c: Partial<DbCompany>) => void; onCancel: () => void }) {
  const [co, setCo] = useState({ ...initial });
  const set = useCallback((k: string, v: unknown) => setCo(p => ({ ...p, [k]: v })), []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">{initial.id ? "Edit Company" : "New Company"}</h3>
      <div className="grid grid-cols-2 gap-4">
        <CoField label="Company Name *" k="name" co={co} set={set} required />
        <div className="flex flex-col gap-1">
          <CoField label={`Slug${!co.id && !co.slug ? " (type a Latin slug manually)" : " (auto-generated, read-only for edits)"}`} k="slug" co={co} set={set} required />
          {!co.id && !co.slug && co.name?.trim() && (
            <p className="text-xs text-amber-600">Name produced an empty slug — enter a Latin-character slug manually (e.g. "company-name")</p>
          )}
        </div>
        <CoField label="Sector *" k="sector" co={co} set={set} required />
        <CoField label="Country *" k="country" co={co} set={set} required />
        <CoField label="Region" k="region" opts={["Southeast Asia", "Asia Pacific", "South Asia", "Global"]} co={co} set={set} />
        <CoField label="Portfolio Status" k="portfolio_status" opts={["Active", "Pipeline"]} co={co} set={set} />
        <CoField label="Maturity" k="maturity" opts={["Leading", "Advanced", "Developing", "Lagging"]} co={co} set={set} />
        <CoField label="Investment Value (S$M)" k="investment_value" type="number" co={co} set={set} />
      </div>
      <div>
        <label htmlFor="co-description" className="text-xs font-medium text-gray-700">Description *</label>
        <textarea id="co-description" aria-required="true" value={co.description || ""} onChange={e => set("description", e.target.value)} rows={3}
          className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <CoField label="ESG Overall" k="esg_overall" type="number" co={co} set={set} />
        <CoField label="Environmental" k="esg_environmental" type="number" co={co} set={set} />
        <CoField label="Social" k="esg_social" type="number" co={co} set={set} />
        <CoField label="Governance" k="esg_governance" type="number" co={co} set={set} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <CoField label="ESG Rating" k="esg_rating" opts={["AAA","AA","A","BBB","BB","B","CCC"]} co={co} set={set} />
        <CoField label="Carbon Intensity (tCO₂e/$M)" k="carbon_intensity" type="number" co={co} set={set} />
        <CoField label="Green Revenue %" k="green_revenue_pct" type="number" co={co} set={set} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <CoField label="Transition Risk" k="transition_risk" opts={["Low","Medium","High","Critical"]} co={co} set={set} />
        <CoField label="Physical Risk" k="physical_risk" opts={["Low","Medium","High","Critical"]} co={co} set={set} />
        <CoField label="Nature Risk" k="nature_risk" opts={["Low","Medium","High","Critical"]} co={co} set={set} />
        <CoField label="Net Zero Commitment" k="net_zero_commitment" opts={["None","Net Zero Pledged","SBTi Committed","SBTi Targets Set"]} co={co} set={set} />
        <CoField label="Pathway Alignment" k="pathway_alignment" opts={["1.5°C","2°C","3°C+","Not assessed"]} co={co} set={set} />
        <CoField label="Temasek Megatrend" k="temasek_megatrend" opts={["Climate Transition","Nature & Biodiversity","Just Transition & Inclusive Growth","AI & Digital Ethics","Longer Lifespans"]} co={co} set={set} />
        <CoField label="SASB Category" k="sasb_category" co={co} set={set} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="button" onClick={() => onSave(co)} className="flex items-center gap-2 px-4 py-2 text-sm bg-[#4B2580] text-white rounded-lg hover:bg-[#3D1A6E]"><Save className="w-3 h-3" /> Save Company</button>
      </div>
    </div>
  );
}

// ─── Engagement Form ─────────────────────────────────────────────────────────
function makeEmptyEng(): Partial<DbEngagement> {
  return { date: todayISO(), type: "Meeting", topic: "", status: "Planned", notes: "" };
}
function EngForm({ companySlug, initial, onSave, onCancel }: { companySlug: string; initial: Partial<DbEngagement>; onSave: (e: Partial<DbEngagement>) => void; onCancel: () => void }) {
  const [eng, setEng] = useState({ ...initial });
  const [topicError, setTopicError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const set = (k: string, v: string) => setEng(p => ({ ...p, [k]: v }));
  const p = `eng-${companySlug}`;
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div><label htmlFor={`${p}-date`} className="text-xs font-medium text-gray-700">Date <span aria-hidden="true">*</span></label><input id={`${p}-date`} type="date" aria-required="true" aria-invalid={dateError || undefined} aria-describedby={dateError ? `${p}-date-err` : undefined} value={eng.date||""} onChange={e=>{set("date",e.target.value); if(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) setDateError(false);}} className={`w-full mt-1 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/40 ${dateError?"border-red-400":"border-gray-200"}`}/>{dateError && <p id={`${p}-date-err`} role="alert" className="text-xs text-red-600 mt-0.5">Valid date required (YYYY-MM-DD)</p>}</div>
        <div><label htmlFor={`${p}-type`} className="text-xs font-medium text-gray-700">Type</label><select id={`${p}-type`} value={eng.type||""} onChange={e=>set("type",e.target.value)} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/40"><option>Meeting</option><option>Call</option><option>Email</option><option>Report Review</option><option>Site Visit</option></select></div>
        <div><label htmlFor={`${p}-status`} className="text-xs font-medium text-gray-700">Status</label><select id={`${p}-status`} value={eng.status||""} onChange={e=>set("status",e.target.value)} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/40"><option>Planned</option><option>Completed</option><option>Overdue</option></select></div>
      </div>
      <div>
        <label htmlFor={`${p}-topic`} className="text-xs font-medium text-gray-700">Topic <span aria-hidden="true">*</span></label>
        <input id={`${p}-topic`} aria-required="true" aria-invalid={topicError || undefined} aria-describedby={topicError ? `${p}-topic-err` : undefined} type="text" value={eng.topic||""} onChange={e=>{set("topic",e.target.value); if(e.target.value.trim()) setTopicError(false);}} className={`w-full mt-1 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/40 ${topicError?"border-red-400":"border-gray-200"}`}/>
        {topicError && <p id={`${p}-topic-err`} role="alert" className="text-xs text-red-600 mt-0.5">Topic is required</p>}
      </div>
      <div><label htmlFor={`${p}-notes`} className="text-xs font-medium text-gray-700">Notes</label><textarea id={`${p}-notes`} value={eng.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/40"/></div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-100">Cancel</button>
        <button type="button" onClick={() => {
          if (!eng.topic?.trim()) { setTopicError(true); document.getElementById(`${p}-topic`)?.focus(); return; }
          if (!eng.date || !/^\d{4}-\d{2}-\d{2}$/.test(eng.date)) { setDateError(true); document.getElementById(`${p}-date`)?.focus(); return; }
          onSave({ ...eng, company_slug: companySlug });
        }} className="px-3 py-1 text-xs bg-[#4B2580] text-white rounded hover:bg-[#3D1A6E]">Save</button>
      </div>
    </div>
  );
}

// ─── Material Issue Form ──────────────────────────────────────────────────────
const EMPTY_MI: Partial<DbMaterialIssue> = { issue: "", severity: "Medium", category: "Environmental", opportunity: false, detail: "" };
function IssueForm({ companySlug, initial, onSave, onCancel }: { companySlug: string; initial: Partial<DbMaterialIssue>; onSave: (i: Partial<DbMaterialIssue>) => void; onCancel: () => void }) {
  const [mi, setMi] = useState({ ...initial });
  const [nameError, setNameError] = useState(false);
  const p = `issue-${companySlug}`;
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor={`${p}-name`} className="text-xs font-medium text-gray-700">Issue Name <span aria-hidden="true">*</span></label>
          <input id={`${p}-name`} aria-required="true" aria-invalid={nameError || undefined} aria-describedby={nameError ? `${p}-name-err` : undefined} type="text" value={mi.issue||""} onChange={e=>{ setMi(p=>({...p,issue:e.target.value})); if(e.target.value.trim()) setNameError(false); }} className={`w-full mt-1 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/40 ${nameError?"border-red-400":"border-gray-200"}`}/>
          {nameError && <p id={`${p}-name-err`} role="alert" className="text-xs text-red-600 mt-0.5">Issue name is required</p>}
        </div>
        <div><label htmlFor={`${p}-sev`} className="text-xs font-medium text-gray-700">Severity</label><select id={`${p}-sev`} value={mi.severity||""} onChange={e=>setMi(p=>({...p,severity:e.target.value as "Critical"|"High"|"Medium"|"Low"}))} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/40"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
        <div><label htmlFor={`${p}-cat`} className="text-xs font-medium text-gray-700">Category</label><select id={`${p}-cat`} value={mi.category||""} onChange={e=>setMi(p=>({...p,category:e.target.value as "Environmental"|"Social"|"Governance"}))} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/40"><option>Environmental</option><option>Social</option><option>Governance</option></select></div>
      </div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={mi.opportunity||false} onChange={e=>setMi(p=>({...p,opportunity:e.target.checked}))} id={`${p}-opp`}/><label htmlFor={`${p}-opp`} className="text-xs text-gray-700">Mark as Opportunity (not risk)</label></div>
      <div><label htmlFor={`${p}-detail`} className="text-xs font-medium text-gray-700">Detail</label><textarea id={`${p}-detail`} value={mi.detail||""} onChange={e=>setMi(p=>({...p,detail:e.target.value}))} rows={2} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/40"/></div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-100">Cancel</button>
        <button type="button" onClick={() => { if (!mi.issue?.trim()) { setNameError(true); document.getElementById(`${p}-name`)?.focus(); return; } onSave({ ...mi, company_slug: companySlug }); }} className="px-3 py-1 text-xs bg-[#4B2580] text-white rounded hover:bg-[#3D1A6E]">Save</button>
      </div>
    </div>
  );
}

// ─── Company Row ──────────────────────────────────────────────────────────────
function CompanyRow({ co, onEdit, onDelete, showToast }: { co: DbCompany; onEdit: () => void; onDelete: () => void; showToast: (msg: string, isError?: boolean) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [engagements, setEngagements] = useState<DbEngagement[]>([]);
  const [issues, setIssues] = useState<DbMaterialIssue[]>([]);
  const [addEng, setAddEng] = useState(false);
  const [addIssue, setAddIssue] = useState(false);
  const [editEng, setEditEng] = useState<DbEngagement | null>(null);
  const [editIssue, setEditIssue] = useState<DbMaterialIssue | null>(null);
  const loadingRef = useRef(false); // prevent concurrent loadDetail fetches
  const pendingReloadRef = useRef(false); // queue a reload if one is already in flight
  const detailLoadCount = useRef(0); // increment on each successful loadDetail to force EngForm/IssueForm remount
  const savingEngRef = useRef(false); // prevent duplicate concurrent inserts
  const savingIssueRef = useRef(false);

  const loadDetail = useCallback(async () => {
    if (loadingRef.current) { pendingReloadRef.current = true; return; }
    loadingRef.current = true;
    pendingReloadRef.current = false;
    try {
      const [{ data: engs, error: engsErr }, { data: mis, error: misErr }] = await Promise.all([
        supabase.from("engagements").select("*").eq("company_slug", co.slug).order("date", { ascending: false }),
        supabase.from("material_issues").select("*").eq("company_slug", co.slug).order("sort_order"),
      ]);
      if (engsErr) console.warn("[Admin] engagements load error:", engsErr.message);
      if (misErr) console.warn("[Admin] material_issues load error:", misErr.message);
      setEngagements(engs || []);
      setIssues(mis || []);
    } catch {
      // silently fall back to empty lists
    } finally {
      loadingRef.current = false;
      detailLoadCount.current += 1; // force EngForm/IssueForm remount via key change
      // If a mutation fired while this fetch was in-flight, reload now
      if (pendingReloadRef.current) loadDetail();
    }
  }, [co.slug]);

  useEffect(() => { if (expanded) loadDetail(); }, [expanded, loadDetail]);

  const saveEng = async (e: Partial<DbEngagement>) => {
    if (savingEngRef.current) return;
    savingEngRef.current = true;
    try {
      const result = await adminWrite({ action: "upsert_engagement", engagement: e, company_slug: co.slug });
      if (!result.ok) { showToast("Error saving engagement: " + (result.error ?? ""), true); return; }
      setAddEng(false); setEditEng(null); clearCache(); loadDetail();
    } catch (err) {
      showToast("Unexpected error saving engagement", true);
      console.error("[Admin] saveEng threw:", err);
    } finally {
      savingEngRef.current = false;
    }
  };
  const delEng = async (id: string) => { if (!confirm("Delete this engagement? This cannot be undone.")) return; try { const result = await adminWrite({ action: "delete_engagement", id }); if (!result.ok) { showToast("Error deleting engagement: " + (result.error ?? ""), true); return; } clearCache(); loadDetail(); } catch (err) { showToast("Unexpected error deleting engagement", true); console.error("[Admin] delEng threw:", err); } };
  const saveIssue = async (i: Partial<DbMaterialIssue>) => {
    if (savingIssueRef.current) return;
    savingIssueRef.current = true;
    try {
      const sort_order = issues.length > 0 ? Math.max(...issues.map(x => x.sort_order ?? 0)) + 1 : 0;
      const result = await adminWrite({ action: "upsert_issue", issue: { ...i, sort_order }, company_slug: co.slug });
      if (!result.ok) { showToast("Error saving issue: " + (result.error ?? ""), true); return; }
      setAddIssue(false); setEditIssue(null); clearCache(); loadDetail();
    } catch (err) {
      showToast("Unexpected error saving issue", true);
      console.error("[Admin] saveIssue threw:", err);
    } finally {
      savingIssueRef.current = false;
    }
  };
  const delIssue = async (id: string) => { if (!confirm("Delete this material issue? This cannot be undone.")) return; try { const result = await adminWrite({ action: "delete_issue", id }); if (!result.ok) { showToast("Error deleting issue: " + (result.error ?? ""), true); return; } clearCache(); loadDetail(); } catch (err) { showToast("Unexpected error deleting issue", true); console.error("[Admin] delIssue threw:", err); } };

  const statusColor = co.portfolio_status === "Active" ? "text-emerald-700 bg-emerald-50 border-emerald-300" : "text-blue-700 bg-blue-50 border-blue-300";
  const riskColor = { Low: "text-emerald-700", Medium: "text-amber-700", High: "text-orange-700", Critical: "text-red-700" }[co.transition_risk] || "text-gray-600";

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-semibold text-gray-900">{co.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusColor}`}>{co.portfolio_status}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{co.sector}</span>
            <span className="text-xs text-gray-500">{co.country}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                (co.esg_overall ?? 0) >= 65 ? "bg-emerald-500" : (co.esg_overall ?? 0) >= 40 ? "bg-amber-500" : "bg-red-500"
              }`} />
              ESG <strong className="text-gray-900">{co.esg_overall ?? "—"}</strong>
            </span>
            <span>Rating <strong className="text-gray-900">{co.esg_rating}</strong></span>
            <span>Transition <strong className={riskColor}>{co.transition_risk}</strong></span>
            <span>S${co.investment_value}M</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label={`Edit ${co.name}`} onClick={onEdit} className="p-2 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4"/></button>
          <button type="button" aria-label={`Delete ${co.name}`} onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
          <button type="button" aria-label={`${co.name} details`} aria-expanded={expanded} aria-controls={`admin-details-${co.id}`} onClick={() => setExpanded(e => !e)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">{expanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}</button>
        </div>
      </div>

      {/* Details panel — always in DOM so aria-controls target always resolves */}
        <div id={`admin-details-${co.id}`} hidden={!expanded} className="border-t border-gray-100 px-5 py-4 space-y-6">
          {/* Engagements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Engagements ({engagements.length})</h4>
              <button type="button" onClick={() => { setAddEng(true); setEditEng(null); }} aria-label="Add engagement" className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900"><Plus className="w-3 h-3" aria-hidden="true"/> Add</button>
            </div>
            {addEng && <div className="mb-3"><EngForm companySlug={co.slug} initial={makeEmptyEng()} onSave={saveEng} onCancel={() => setAddEng(false)}/></div>}
            <div className="space-y-2">
              {engagements.map(e => editEng?.id === e.id ? (
                <EngForm key={`${e.id}-${detailLoadCount.current}`} companySlug={co.slug} initial={e} onSave={saveEng} onCancel={() => setEditEng(null)}/>
              ) : (
                <div key={e.id} className="flex items-center gap-3 text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-500 w-24 flex-shrink-0">{e.date}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${e.status==="Completed"?"bg-emerald-50 text-emerald-700":e.status==="Overdue"?"bg-red-50 text-red-700":"bg-blue-50 text-blue-700"}`}>{e.status}</span>
                  <span className="flex-1 text-gray-700 truncate">{e.topic}</span>
                  <button type="button" aria-label={`Edit engagement: ${e.topic}`} onClick={() => { setEditEng(e); setAddEng(false); }} className="text-gray-500 hover:text-purple-700"><Edit3 className="w-3 h-3"/></button>
                  <button type="button" aria-label={`Delete engagement: ${e.topic}`} onClick={() => delEng(e.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                </div>
              ))}
              {engagements.length === 0 && !addEng && <p className="text-xs text-gray-500 italic">No engagements yet</p>}
            </div>
          </div>

          {/* Material Issues */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Material Issues ({issues.length})</h4>
              <button type="button" onClick={() => { setAddIssue(true); setEditIssue(null); }} aria-label="Add material issue" className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900"><Plus className="w-3 h-3" aria-hidden="true"/> Add</button>
            </div>
            {addIssue && <div className="mb-3"><IssueForm companySlug={co.slug} initial={EMPTY_MI} onSave={saveIssue} onCancel={() => setAddIssue(false)}/></div>}
            <div className="space-y-2">
              {issues.map(i => editIssue?.id === i.id ? (
                <IssueForm key={`${i.id}-${detailLoadCount.current}`} companySlug={co.slug} initial={i} onSave={saveIssue} onCancel={() => setEditIssue(null)}/>
              ) : (
                <div key={i.id} className="flex items-center gap-3 text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${i.severity==="Critical"?"bg-red-50 text-red-700":i.severity==="High"?"bg-orange-50 text-orange-700":i.severity==="Medium"?"bg-amber-50 text-amber-700":"bg-gray-100 text-gray-600"}`}>{i.severity}</span>
                  <span className="text-gray-500 text-[10px]">{i.category}</span>
                  {i.opportunity && <span className="text-[10px] text-emerald-600">Opportunity</span>}
                  <span className="flex-1 text-gray-700 truncate">{i.issue}</span>
                  <button type="button" aria-label={`Edit issue: ${i.issue}`} onClick={() => { setEditIssue(i); setAddIssue(false); }} className="text-gray-500 hover:text-purple-700"><Edit3 className="w-3 h-3"/></button>
                  <button type="button" aria-label={`Delete issue: ${i.issue}`} onClick={() => delIssue(i.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                </div>
              ))}
              {issues.length === 0 && !addIssue && <p className="text-xs text-gray-500 italic">No material issues yet</p>}
            </div>
          </div>
        </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const auth = useAdminAuth();
  const [companies, setCompanies] = useState<DbCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DbCompany | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [toastIsError, setToastIsError] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminSort, setAdminSort] = useState<"name"|"esg"|"recent">("recent");

  const showToast = (msg: string, isError = false) => {
    setToast(msg);
    setToastIsError(isError);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => { setToast(""); setToastIsError(false); }, 5000);
  };

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("companies").select("*").order("created_at");
      if (error) { showToast("Database error: " + error.message, true); setCompanies([]); }
      else setCompanies((data || []) as DbCompany[]);
    } catch {
      showToast("Database unavailable — check connection", true);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (auth.authed) loadCompanies(); }, [auth.authed, loadCompanies]);

  // Cleanup toast timer on unmount to prevent setState on unmounted component
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);
  const savingCompanyRef = useRef(false); // prevent duplicate concurrent saves

  const saveCompany = async (co: Partial<DbCompany>) => {
    if (savingCompanyRef.current) return;
    if (!co.name?.trim() || !co.slug?.trim() || !co.sector?.trim() || !co.country?.trim() || !co.description?.trim()) return showToast("Name, slug, sector, country, and description are required", true);
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(co.slug.trim())) return showToast("Slug must be lowercase alphanumeric with hyphens only, no leading/trailing hyphens (e.g. my-company)", true);
    const e = co.esg_environmental ?? 0, s = co.esg_social ?? 0, g = co.esg_governance ?? 0, ov = co.esg_overall ?? 0;
    if ([e,s,g,ov].some(v => v < 0 || v > 100)) return showToast("ESG scores must be between 0 and 100", true);
    if ((co.green_revenue_pct ?? 0) < 0 || (co.green_revenue_pct ?? 0) > 100) return showToast("Green revenue % must be between 0 and 100", true);
    if ((co.carbon_intensity ?? 0) < 0) return showToast("Carbon intensity must be 0 or greater", true);
    if ((co.investment_value ?? 0) < 0) return showToast("Investment value must be 0 or greater", true);
    savingCompanyRef.current = true;
    setSaving(true);
    try {
      const result = await adminWrite({ action: "upsert_company", company: co });
      if (!result.ok) showToast("Error: " + (result.error ?? "Unknown error"), true);
      else if (co.id) { showToast("Company updated ✓"); setEditing(null); clearCache(); loadCompanies(); }
      else { showToast("Company added ✓"); setAdding(false); clearCache(); loadCompanies(); }
    } catch (err) {
      showToast("Unexpected error saving company", true);
      console.error("[Admin] saveCompany threw:", err);
    } finally {
      savingCompanyRef.current = false;
      setSaving(false);
    }
  };

  const deleteCompany = async (id: string, slug: string, name: string) => {
    if (!confirm(`Delete ${name}? This also deletes all engagements and material issues.`)) return;
    try {
      const result = await adminWrite({ action: "delete_company", id, slug });
      if (!result.ok) showToast("Partial deletion error — refresh to verify: " + (result.error ?? ""), true);
      else showToast(`${name} deleted`);
      clearCache();
      loadCompanies();
    } catch (err) {
      showToast("Unexpected error during deletion", true);
      console.error("[Admin] deleteCompany threw:", err);
    }
  };

  // Login screen
  if (!auth.authed) return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#4B2580] rounded-xl flex items-center justify-center"><Lock className="w-5 h-5 text-white"/></div>
          <div>
            <div className="font-bold text-[#4B2580]" style={{fontFamily:"Georgia,serif",letterSpacing:"0.1em"}}>TEMASEK</div>
            <div className="text-xs text-gray-500">Catalyst Admin</div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="admin-password" className="text-xs font-medium text-gray-700">Admin Password <span className="text-gray-500 font-normal">(set in Vercel env vars)</span></label>
            <input id="admin-password" type="password" aria-required="true" autoComplete="off" value={auth.pw} onChange={e => auth.setPw(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !auth.checking) auth.check(); }}
              placeholder="Enter password" autoFocus
              aria-invalid={auth.err || undefined}
              aria-describedby={auth.err ? "admin-pw-error" : undefined}
              className={`w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${auth.err ? "border-red-400 focus:ring-red-400/50" : "border-gray-200 focus:border-purple-400 focus:ring-purple-400/30"}`} />
            {auth.err && <p id="admin-pw-error" role="alert" className="text-xs text-red-600 mt-1">Incorrect password</p>}
          </div>
          <button type="button" onClick={auth.check} disabled={auth.checking} aria-busy={auth.checking} className="w-full bg-[#4B2580] hover:bg-[#3D1A6E] disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            {auth.checking ? "Verifying…" : "Access Admin Panel"}
          </button>
        </div>
      </div>
    </div>
  );

  const activeCount = companies.filter(c => c.portfolio_status === "Active").length;
  const pipelineCount = companies.filter(c => c.portfolio_status === "Pipeline").length;

  const adminSearchTrimmed = adminSearch.trim().toLowerCase();
  const filteredAdminCompanies = adminSearchTrimmed
    ? companies.filter(co =>
        co.name.toLowerCase().includes(adminSearchTrimmed) ||
        co.sector.toLowerCase().includes(adminSearchTrimmed) ||
        // Always include the company being edited to prevent losing unsaved changes
        (editing && co.id === editing.id)
      )
    : companies;
  const sortedAdminCompanies = [...filteredAdminCompanies].sort((a, b) => {
    if (adminSort === "name") return a.name.localeCompare(b.name);
    if (adminSort === "esg") {
      const av = a.esg_overall ?? 0;
      const bv = b.esg_overall ?? 0;
      return bv - av;
    }
    // "recent" = newest first; use id as tiebreaker when created_at timestamps are equal
    const dateCmp = (b.created_at ?? "").localeCompare(a.created_at ?? "");
    return dateCmp !== 0 ? dateCmp : (b.id ?? "").localeCompare(a.id ?? "");
  });

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="font-bold text-lg text-[#4B2580]" style={{fontFamily:"Georgia,serif",letterSpacing:"0.12em"}}>TEMASEK</div>
            <span aria-hidden="true" className="text-gray-400">|</span>
            <span className="text-sm font-semibold text-gray-900">Portfolio Admin</span>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><Building2 className="w-3 h-3"/>{activeCount} Active</span>
              <span className="flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"><Users className="w-3 h-3"/>{pipelineCount} Pipeline</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-500 hover:text-purple-700 transition-colors">← Back to App</Link>
            <button type="button" onClick={auth.logout} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"><LogOut className="w-3 h-3"/>Sign out</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Connection banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 mb-6 flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"/>
          <p className="text-xs text-emerald-800"><strong>Live integration active.</strong> Companies, engagements, and material issues added here appear in the Scout, Steward, Signal, and Overview pages automatically. Changes propagate within 5 seconds.</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-gray-900">Portfolio Companies</h1>
          <button type="button" onClick={() => { setAdding(true); setEditing(null); }} className="flex items-center gap-2 bg-[#4B2580] hover:bg-[#3D1A6E] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4"/> Add Company</button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={adminSearch}
                onChange={e => setAdminSearch(e.target.value)}
                placeholder="Filter by name or sector..."
                aria-label="Filter companies by name or sector"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 pl-8"
              />
              <svg aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {adminSearch && <button type="button" onClick={() => setAdminSearch("")} className="text-xs text-gray-500 hover:text-gray-700">Clear</button>}
            <div role="radiogroup" aria-label="Sort companies by" className="flex items-center gap-1"
              onKeyDown={(e) => {
                const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
                const idx = btns.indexOf(e.target as HTMLButtonElement);
                if (idx === -1) return;
                if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); const n=btns[(idx+1)%btns.length]; n.click(); n.focus(); }
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); const n=btns[(idx-1+btns.length)%btns.length]; n.click(); n.focus(); }
              }}
            >
              {([{key:"recent",label:"Recent"},{key:"name",label:"A–Z"},{key:"esg",label:"ESG Score"}] as {key:"recent"|"name"|"esg"; label:string}[]).map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={adminSort === opt.key}
                  tabIndex={adminSort === opt.key ? 0 : -1}
                  onClick={() => setAdminSort(opt.key)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${adminSort === opt.key ? "bg-[#4B2580] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {filteredAdminCompanies.length === 0 && adminSearchTrimmed && (
            <div className="text-center py-8 text-gray-500 text-sm">No companies match &ldquo;{adminSearch}&rdquo;</div>
          )}
        </div>

        {adding && (
          <div className="mb-6">
            <CoForm initial={makeEmptyCo()} onSave={saveCompany} onCancel={() => setAdding(false)} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Loading portfolio data…</div>
        ) : (
          <div className="space-y-3">
            {sortedAdminCompanies.map(co => editing?.id === co.id ? (
              <CoForm key={co.id} initial={editing} onSave={saveCompany} onCancel={() => setEditing(null)} />
            ) : (
              <CompanyRow key={co.id} co={co} onEdit={() => { setEditing(co); setAdding(false); }} onDelete={() => deleteCompany(co.id, co.slug, co.name)} showToast={showToast} />
            ))}
            {sortedAdminCompanies.length === 0 && !adding && !adminSearch && (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3"/>
                <p className="text-gray-500 font-medium">No companies yet</p>
                <p className="text-sm text-gray-500 mt-1">Click &quot;Add Company&quot; to add your first portfolio company</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pre-mounted toast live region — content update (not mount) triggers AT announcement */}
      <div
        role={toastIsError ? "alert" : "status"}
        aria-live={toastIsError ? "assertive" : "polite"}
        aria-atomic="true"
        className={toast ? "fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg" : "sr-only"}
      >
        {toast}
      </div>
      {/* Persistent aria-live region for saving status — must be pre-mounted for reliable AT announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {saving ? "Saving…" : ""}
      </div>
      {saving && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div aria-hidden="true" className="absolute inset-0" />
          <div aria-hidden="true" className="relative bg-white rounded-xl px-6 py-4 text-sm text-gray-700">Saving…</div>
        </div>
      )}
    </div>
  );
}
