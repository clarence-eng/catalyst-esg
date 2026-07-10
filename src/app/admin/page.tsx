"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase, type DbCompany, type DbEngagement, type DbMaterialIssue } from "@/lib/supabase";
import { Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronUp, Lock, LogOut, Building2, Users, AlertCircle } from "lucide-react";

// ─── Auth ───────────────────────────────────────────────────────────────────
function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const check = () => {
    if (pw === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "catalyst2026")) {
      setAuthed(true); setErr(false);
    } else setErr(true);
  };
  return { authed, pw, setPw, err, check, logout: () => setAuthed(false) };
}

// ─── Company Form ────────────────────────────────────────────────────────────
const EMPTY_CO: Partial<DbCompany> = {
  name: "", slug: "", sector: "", country: "", region: "Southeast Asia",
  description: "", portfolio_status: "Active", maturity: "Developing",
  investment_value: 100, carbon_intensity: 50, green_revenue_pct: 10,
  esg_overall: 55, esg_environmental: 55, esg_social: 55, esg_governance: 55,
  esg_rating: "BBB", transition_risk: "Medium", physical_risk: "Medium",
  pathway_alignment: "Not assessed", nature_risk: "Medium",
  net_zero_commitment: "None", sasb_category: "", temasek_megatrend: "Climate Transition",
  last_updated: new Date().toISOString().split("T")[0],
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function CoForm({ initial, onSave, onCancel }: { initial: Partial<DbCompany>; onSave: (c: Partial<DbCompany>) => void; onCancel: () => void }) {
  const [co, setCo] = useState({ ...initial });
  const set = (k: string, v: unknown) => setCo(p => ({ ...p, [k]: v }));

  const F = ({ label, k, type = "text", opts }: { label: string; k: string; type?: string; opts?: string[] }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {opts ? (
        <select value={(co as Record<string,unknown>)[k] as string || ""} onChange={e => set(k, e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400">
          {opts.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={(co as Record<string,unknown>)[k] as string || ""}
          onChange={e => { const v = type === "number" ? parseFloat(e.target.value) || 0 : e.target.value; set(k, v); if (k === "name") set("slug", slugify(e.target.value)); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
      )}
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">{initial.id ? "Edit Company" : "New Company"}</h3>
      <div className="grid grid-cols-2 gap-4">
        <F label="Company Name *" k="name" />
        <F label="Slug (auto)" k="slug" />
        <F label="Sector *" k="sector" />
        <F label="Country *" k="country" />
        <F label="Region" k="region" opts={["Southeast Asia", "Asia Pacific", "South Asia", "Global"]} />
        <F label="Portfolio Status" k="portfolio_status" opts={["Active", "Pipeline"]} />
        <F label="Maturity" k="maturity" opts={["Leading", "Advanced", "Developing", "Lagging"]} />
        <F label="Investment Value (S$M)" k="investment_value" type="number" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-700">Description *</label>
        <textarea value={co.description || ""} onChange={e => set("description", e.target.value)} rows={3}
          className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <F label="ESG Overall" k="esg_overall" type="number" />
        <F label="Environmental" k="esg_environmental" type="number" />
        <F label="Social" k="esg_social" type="number" />
        <F label="Governance" k="esg_governance" type="number" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <F label="ESG Rating" k="esg_rating" opts={["AAA","AA","A","BBB","BB","B","CCC"]} />
        <F label="Carbon Intensity (tCO₂e/$M)" k="carbon_intensity" type="number" />
        <F label="Green Revenue %" k="green_revenue_pct" type="number" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <F label="Transition Risk" k="transition_risk" opts={["Low","Medium","High","Critical"]} />
        <F label="Physical Risk" k="physical_risk" opts={["Low","Medium","High","Critical"]} />
        <F label="Nature Risk" k="nature_risk" opts={["Low","Medium","High","Critical"]} />
        <F label="Net Zero Commitment" k="net_zero_commitment" opts={["None","Net Zero Pledged","SBTi Committed","SBTi Targets Set"]} />
        <F label="Pathway Alignment" k="pathway_alignment" opts={["1.5°C","2°C","3°C+","Not assessed"]} />
        <F label="Temasek Megatrend" k="temasek_megatrend" opts={["Climate Transition","Nature & Biodiversity","Just Transition & Inclusive Growth","AI & Digital Ethics","Longer Lifespans"]} />
        <F label="SASB Category" k="sasb_category" />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="button" onClick={() => onSave(co)} className="flex items-center gap-2 px-4 py-2 text-sm bg-[#4B2580] text-white rounded-lg hover:bg-[#3D1A6E]"><Save className="w-3 h-3" /> Save Company</button>
      </div>
    </div>
  );
}

// ─── Engagement Form ─────────────────────────────────────────────────────────
const EMPTY_ENG: Partial<DbEngagement> = { date: new Date().toISOString().split("T")[0], type: "Meeting", topic: "", status: "Planned", notes: "" };
function EngForm({ companySlug, initial, onSave, onCancel }: { companySlug: string; initial: Partial<DbEngagement>; onSave: (e: Partial<DbEngagement>) => void; onCancel: () => void }) {
  const [eng, setEng] = useState({ ...initial });
  const set = (k: string, v: string) => setEng(p => ({ ...p, [k]: v }));
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-xs font-medium text-gray-700">Date</label><input type="date" value={eng.date||""} onChange={e=>set("date",e.target.value)} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs"/></div>
        <div><label className="text-xs font-medium text-gray-700">Type</label><select value={eng.type||""} onChange={e=>set("type",e.target.value)} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs"><option>Meeting</option><option>Call</option><option>Email</option><option>Site Visit</option></select></div>
        <div><label className="text-xs font-medium text-gray-700">Status</label><select value={eng.status||""} onChange={e=>set("status",e.target.value)} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs"><option>Planned</option><option>Completed</option><option>Overdue</option></select></div>
      </div>
      <div><label className="text-xs font-medium text-gray-700">Topic</label><input type="text" value={eng.topic||""} onChange={e=>set("topic",e.target.value)} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs"/></div>
      <div><label className="text-xs font-medium text-gray-700">Notes</label><textarea value={eng.notes||""} onChange={e=>set("notes",e.target.value)} rows={2} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs"/></div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-100">Cancel</button>
        <button type="button" onClick={() => onSave({ ...eng, company_slug: companySlug })} className="px-3 py-1 text-xs bg-[#4B2580] text-white rounded hover:bg-[#3D1A6E]">Save</button>
      </div>
    </div>
  );
}

// ─── Material Issue Form ──────────────────────────────────────────────────────
const EMPTY_MI: Partial<DbMaterialIssue> = { issue: "", severity: "Medium", category: "Environmental", opportunity: false, detail: "" };
function IssueForm({ companySlug, initial, onSave, onCancel }: { companySlug: string; initial: Partial<DbMaterialIssue>; onSave: (i: Partial<DbMaterialIssue>) => void; onCancel: () => void }) {
  const [mi, setMi] = useState({ ...initial });
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div><label className="text-xs font-medium text-gray-700">Issue Name</label><input type="text" value={mi.issue||""} onChange={e=>setMi(p=>({...p,issue:e.target.value}))} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs"/></div>
        <div><label className="text-xs font-medium text-gray-700">Severity</label><select value={mi.severity||""} onChange={e=>setMi(p=>({...p,severity:e.target.value as "Critical"|"High"|"Medium"|"Low"}))} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></div>
        <div><label className="text-xs font-medium text-gray-700">Category</label><select value={mi.category||""} onChange={e=>setMi(p=>({...p,category:e.target.value as "Environmental"|"Social"|"Governance"}))} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs"><option>Environmental</option><option>Social</option><option>Governance</option></select></div>
      </div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={mi.opportunity||false} onChange={e=>setMi(p=>({...p,opportunity:e.target.checked}))} id="opp"/><label htmlFor="opp" className="text-xs text-gray-700">Mark as Opportunity (not risk)</label></div>
      <div><label className="text-xs font-medium text-gray-700">Detail</label><textarea value={mi.detail||""} onChange={e=>setMi(p=>({...p,detail:e.target.value}))} rows={2} className="w-full mt-1 border border-gray-200 rounded px-2 py-1 text-xs"/></div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-100">Cancel</button>
        <button type="button" onClick={() => onSave({ ...mi, company_slug: companySlug })} className="px-3 py-1 text-xs bg-[#4B2580] text-white rounded hover:bg-[#3D1A6E]">Save</button>
      </div>
    </div>
  );
}

// ─── Company Row ──────────────────────────────────────────────────────────────
function CompanyRow({ co, onEdit, onDelete }: { co: DbCompany; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [engagements, setEngagements] = useState<DbEngagement[]>([]);
  const [issues, setIssues] = useState<DbMaterialIssue[]>([]);
  const [addEng, setAddEng] = useState(false);
  const [addIssue, setAddIssue] = useState(false);
  const [editEng, setEditEng] = useState<DbEngagement | null>(null);
  const [editIssue, setEditIssue] = useState<DbMaterialIssue | null>(null);

  const loadDetail = useCallback(async () => {
    const [{ data: engs }, { data: mis }] = await Promise.all([
      supabase.from("engagements").select("*").eq("company_slug", co.slug).order("date", { ascending: false }),
      supabase.from("material_issues").select("*").eq("company_slug", co.slug).order("sort_order"),
    ]);
    setEngagements(engs || []);
    setIssues(mis || []);
  }, [co.slug]);

  useEffect(() => { if (expanded) loadDetail(); }, [expanded, loadDetail]);

  const saveEng = async (e: Partial<DbEngagement>) => {
    if (e.id) await supabase.from("engagements").update(e).eq("id", e.id);
    else await supabase.from("engagements").insert(e);
    setAddEng(false); setEditEng(null); loadDetail();
  };
  const delEng = async (id: string) => { await supabase.from("engagements").delete().eq("id", id); loadDetail(); };
  const saveIssue = async (i: Partial<DbMaterialIssue>) => {
    if (i.id) await supabase.from("material_issues").update(i).eq("id", i.id);
    else await supabase.from("material_issues").insert({ ...i, sort_order: issues.length });
    setAddIssue(false); setEditIssue(null); loadDetail();
  };
  const delIssue = async (id: string) => { await supabase.from("material_issues").delete().eq("id", id); loadDetail(); };

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
            <span>ESG <strong className="text-gray-900">{co.esg_overall}</strong></span>
            <span>Rating <strong className="text-gray-900">{co.esg_rating}</strong></span>
            <span>Transition <strong className={riskColor}>{co.transition_risk}</strong></span>
            <span>S${co.investment_value}M</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onEdit} className="p-2 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4"/></button>
          <button type="button" onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
          <button type="button" onClick={() => setExpanded(e => !e)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">{expanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}</button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-6">
          {/* Engagements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Engagements ({engagements.length})</h4>
              <button type="button" onClick={() => setAddEng(true)} className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900"><Plus className="w-3 h-3"/> Add</button>
            </div>
            {addEng && <div className="mb-3"><EngForm companySlug={co.slug} initial={EMPTY_ENG} onSave={saveEng} onCancel={() => setAddEng(false)}/></div>}
            <div className="space-y-2">
              {engagements.map(e => editEng?.id === e.id ? (
                <EngForm key={e.id} companySlug={co.slug} initial={e} onSave={saveEng} onCancel={() => setEditEng(null)}/>
              ) : (
                <div key={e.id} className="flex items-center gap-3 text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-500 w-24 flex-shrink-0">{e.date}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${e.status==="Completed"?"bg-emerald-50 text-emerald-700":e.status==="Overdue"?"bg-red-50 text-red-700":"bg-blue-50 text-blue-700"}`}>{e.status}</span>
                  <span className="flex-1 text-gray-700 truncate">{e.topic}</span>
                  <button type="button" onClick={() => setEditEng(e)} className="text-gray-400 hover:text-purple-700"><Edit3 className="w-3 h-3"/></button>
                  <button type="button" onClick={() => delEng(e.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                </div>
              ))}
              {engagements.length === 0 && !addEng && <p className="text-xs text-gray-400 italic">No engagements yet</p>}
            </div>
          </div>

          {/* Material Issues */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Material Issues ({issues.length})</h4>
              <button type="button" onClick={() => setAddIssue(true)} className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900"><Plus className="w-3 h-3"/> Add</button>
            </div>
            {addIssue && <div className="mb-3"><IssueForm companySlug={co.slug} initial={EMPTY_MI} onSave={saveIssue} onCancel={() => setAddIssue(false)}/></div>}
            <div className="space-y-2">
              {issues.map(i => editIssue?.id === i.id ? (
                <IssueForm key={i.id} companySlug={co.slug} initial={i} onSave={saveIssue} onCancel={() => setEditIssue(null)}/>
              ) : (
                <div key={i.id} className="flex items-center gap-3 text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${i.severity==="Critical"?"bg-red-50 text-red-700":i.severity==="High"?"bg-orange-50 text-orange-700":i.severity==="Medium"?"bg-amber-50 text-amber-700":"bg-gray-100 text-gray-600"}`}>{i.severity}</span>
                  <span className="text-gray-500 text-[10px]">{i.category}</span>
                  {i.opportunity && <span className="text-[10px] text-emerald-600">Opportunity</span>}
                  <span className="flex-1 text-gray-700 truncate">{i.issue}</span>
                  <button type="button" onClick={() => setEditIssue(i)} className="text-gray-400 hover:text-purple-700"><Edit3 className="w-3 h-3"/></button>
                  <button type="button" onClick={() => delIssue(i.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                </div>
              ))}
              {issues.length === 0 && !addIssue && <p className="text-xs text-gray-400 italic">No material issues yet</p>}
            </div>
          </div>
        </div>
      )}
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

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("companies").select("*").order("created_at");
    setCompanies((data || []) as DbCompany[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (auth.authed) loadCompanies(); }, [auth.authed, loadCompanies]);

  const saveCompany = async (co: Partial<DbCompany>) => {
    if (!co.name || !co.slug) return showToast("Name and slug are required");
    setSaving(true);
    if (co.id) {
      const { error } = await supabase.from("companies").update(co).eq("id", co.id);
      if (error) showToast("Error: " + error.message);
      else { showToast("Company updated ✓"); setEditing(null); loadCompanies(); }
    } else {
      const { error } = await supabase.from("companies").insert(co);
      if (error) showToast("Error: " + error.message);
      else { showToast("Company added ✓"); setAdding(false); loadCompanies(); }
    }
    setSaving(false);
  };

  const deleteCompany = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This also deletes all engagements and material issues.`)) return;
    await supabase.from("companies").delete().eq("id", id);
    showToast(`${name} deleted`);
    loadCompanies();
  };

  // Login screen
  if (!auth.authed) return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#4B2580] rounded-xl flex items-center justify-center"><Lock className="w-5 h-5 text-white"/></div>
          <div>
            <div className="font-bold text-gray-900" style={{fontFamily:"Georgia,serif",color:"#4B2580",letterSpacing:"0.1em"}}>TEMASEK</div>
            <div className="text-xs text-gray-500">Catalyst Admin</div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700">Admin Password</label>
            <input type="password" value={auth.pw} onChange={e => auth.setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && auth.check()}
              placeholder="Enter password" autoFocus
              className={`w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:outline-none ${auth.err ? "border-red-400" : "border-gray-200 focus:border-purple-400"}`} />
            {auth.err && <p className="text-xs text-red-600 mt-1">Incorrect password</p>}
          </div>
          <button type="button" onClick={auth.check} className="w-full bg-[#4B2580] hover:bg-[#3D1A6E] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            Access Admin Panel
          </button>
        </div>
      </div>
    </div>
  );

  const activeCount = companies.filter(c => c.portfolio_status === "Active").length;
  const pipelineCount = companies.filter(c => c.portfolio_status === "Pipeline").length;

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="font-bold text-lg" style={{fontFamily:"Georgia,serif",color:"#4B2580",letterSpacing:"0.12em"}}>TEMASEK</div>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-900">Portfolio Admin</span>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><Building2 className="w-3 h-3"/>{activeCount} Active</span>
              <span className="flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"><Users className="w-3 h-3"/>{pipelineCount} Pipeline</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-gray-500 hover:text-purple-700 transition-colors">← Back to App</a>
            <button type="button" onClick={auth.logout} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"><LogOut className="w-3 h-3"/>Sign out</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Add banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0"/>
          <p className="text-xs text-amber-800">Companies added here are stored in Supabase but <strong>the main app pages still use the demo TypeScript data</strong>. After adding companies here, a developer needs to connect the app pages to read from Supabase. The admin panel itself is fully functional for data entry.</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-gray-900">Portfolio Companies</h1>
          <button type="button" onClick={() => { setAdding(true); setEditing(null); }} className="flex items-center gap-2 bg-[#4B2580] hover:bg-[#3D1A6E] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Plus className="w-4 h-4"/> Add Company</button>
        </div>

        {adding && (
          <div className="mb-6">
            <CoForm initial={EMPTY_CO} onSave={saveCompany} onCancel={() => setAdding(false)} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Loading portfolio data…</div>
        ) : (
          <div className="space-y-3">
            {companies.map(co => editing?.id === co.id ? (
              <CoForm key={co.id} initial={editing} onSave={saveCompany} onCancel={() => setEditing(null)} />
            ) : (
              <CompanyRow key={co.id} co={co} onEdit={() => { setEditing(co); setAdding(false); }} onDelete={() => deleteCompany(co.id, co.name)} />
            ))}
            {companies.length === 0 && !adding && (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                <p className="text-gray-500 font-medium">No companies yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Add Company" to add your first portfolio company</p>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg animate-pulse">
          {toast}
        </div>
      )}
      {saving && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl px-6 py-4 text-sm text-gray-700">Saving…</div>
        </div>
      )}
    </div>
  );
}
