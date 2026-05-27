"use client";

import { useState, useEffect } from "react";
import { AnalyseResult } from "@/app/api/analyse/route";

export interface AnalyseState {
  nom: string; ville: string; url: string; result: AnalyseResult | null;
}

interface CRMEntry { id: string; business: { name: string; address: string; phone?: string; website?: string }; status: string; analyse_score?: number; analyse_result?: AnalyseResult; added_at: string; }

interface Props { businessId?: string; state: AnalyseState; onStateChange: (s: AnalyseState) => void; }

const scoreColor  = (s: number) => s >= 7 ? "#22c55e" : s >= 5 ? "#f59e0b" : "#ef4444";
const scoreBg     = (s: number) => s >= 7 ? "rgba(34,197,94,0.1)"   : s >= 5 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";
const scoreBorder = (s: number) => s >= 7 ? "rgba(34,197,94,0.3)"   : s >= 5 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)";
const scoreLabel  = (s: number) => s >= 7 ? "Priorité haute" : s >= 5 ? "Priorité moyenne" : "Priorité basse";

const TABS = [
  { id: "manuel",    icon: "✍️", label: "Analyse manuelle" },
  { id: "dashboard", icon: "📊", label: "Tableau de bord" },
  { id: "batch",     icon: "⚡", label: "Analyse par lot" },
  { id: "script",    icon: "📞", label: "Script d'appel" },
  { id: "stats",     icon: "📈", label: "Statistiques" },
];

const SECTOR_SCRIPTS = [
  { id: "real_estate", label: "Agence immobilière" },
  { id: "recruitment", label: "Cabinet de recrutement" },
  { id: "travel",      label: "Agence de voyage" },
  { id: "concierge",   label: "Conciergerie" },
  { id: "events",      label: "Agence événementielle" },
  { id: "developer",   label: "Promoteur immobilier" },
  { id: "seasonal",    label: "Location saisonnière" },
];

// ── Composant réutilisable : affichage résultat analyse ────────────────────────
function AnalyseResultView({ result, onAddToCRM, saving, saved }: { result: AnalyseResult; onAddToCRM?: () => void; saving?: boolean; saved?: boolean; }) {
  const [copied, setCopied] = useState<number | null>(null);
  const copyPhrase = (i: number, t: string) => { navigator.clipboard.writeText(t); setCopied(i); setTimeout(() => setCopied(null), 1500); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Header */}
      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ padding:"20px 24px", display:"flex", gap:20, alignItems:"center", flexWrap:"wrap", borderBottom:"1px solid var(--border)" }}>
          <div style={{ padding:"16px 24px", borderRadius:14, textAlign:"center", flexShrink:0, background:scoreBg(result.score_prospection), border:`2px solid ${scoreBorder(result.score_prospection)}` }}>
            <div style={{ fontSize:40, fontWeight:900, color:scoreColor(result.score_prospection), lineHeight:1 }}>{result.score_prospection}</div>
            <div style={{ fontSize:10, fontWeight:700, color:scoreColor(result.score_prospection), textTransform:"uppercase", letterSpacing:"0.06em", marginTop:4 }}>/10</div>
            <div style={{ fontSize:11, color:scoreColor(result.score_prospection), fontWeight:600, marginTop:6 }}>{scoreLabel(result.score_prospection)}</div>
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>{result.entreprise_nom}</div>
            <div style={{ fontSize:13, color:"var(--muted)", marginBottom:10 }}>📍 {result.entreprise_adresse}</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <span style={{ padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700, background: result.a_site_web ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: result.a_site_web ? "#22c55e" : "#ef4444", border:`1px solid ${result.a_site_web ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                {result.a_site_web ? "✓ A un site web" : "✗ Pas de site"}
              </span>
              {result.note_google && <span style={{ padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600, background:"rgba(250,204,21,0.1)", color:"#facc15", border:"1px solid rgba(250,204,21,0.25)" }}>⭐ {result.note_google}/5 ({result.nb_avis} avis)</span>}
            </div>
          </div>
          {onAddToCRM && (
            <div>
              {saved ? <div style={{ padding:"10px 20px", borderRadius:10, background:"var(--green-bg)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e", fontSize:13, fontWeight:700 }}>✓ Dans le CRM</div>
              : <button onClick={onAddToCRM} disabled={saving} className="btn btn-success" style={{ padding:"10px 24px", fontSize:14 }}>{saving ? <><span className="spinner" /> Ajout…</> : "➕ Ajouter au CRM"}</button>}
            </div>
          )}
        </div>
        <div style={{ padding:"14px 24px", background:"var(--surface2)", fontSize:13, color:"var(--muted)", fontStyle:"italic" }}>💡 {result.raison_score}</div>
      </div>

      {/* Problèmes */}
      {result.problemes_detectes.length > 0 && (
        <div className="card">
          <div className="card-header"><div style={{ fontWeight:700, fontSize:14 }}>⚠️ Problèmes détectés</div></div>
          <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {result.problemes_detectes.map((p, i) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"10px 14px", borderRadius:10, background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.15)" }}>
                <span style={{ color:"#ef4444", flexShrink:0 }}>✗</span>
                <span style={{ fontSize:13 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phrases d'accroche */}
      {result.phrases_accroche.length > 0 && (
        <div className="card">
          <div className="card-header"><div style={{ fontWeight:700, fontSize:14 }}>📞 Phrases d'accroche</div><div style={{ fontSize:12, color:"var(--muted)" }}>Cliquez pour copier</div></div>
          <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {result.phrases_accroche.map((phrase, i) => (
              <div key={i} style={{ display:"flex", gap:12, padding:"14px 16px", borderRadius:12, background:"var(--surface2)", border:"1px solid var(--border2)" }}>
                <span style={{ width:24, height:24, borderRadius:"50%", flexShrink:0, background:"var(--accent-bg)", border:"1px solid var(--accent-border)", color:"var(--accent-light)", fontSize:12, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</span>
                <span style={{ flex:1, fontSize:14, lineHeight:1.5 }}>{phrase}</span>
                <button onClick={() => copyPhrase(i, phrase)} className="btn btn-ghost btn-sm" style={{ flexShrink:0 }}>{copied===i ? "✓ Copié" : "Copier"}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conseil global */}
      {result.conseil_global && (
        <div className="card" style={{ borderLeft:"3px solid var(--accent)" }}>
          <div className="card-body">
            <div style={{ fontSize:11, fontWeight:700, color:"var(--accent-light)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>💬 Conseil global</div>
            <p style={{ margin:0, fontSize:14, lineHeight:1.7 }}>{result.conseil_global}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Onglet A : Analyse manuelle ────────────────────────────────────────────────
function TabManuel({ businessId, state, onStateChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { nom, ville, url, result } = state;

  const analyse = async () => {
    if (!nom.trim() || !ville.trim()) { setError("Nom et ville requis"); return; }
    setLoading(true); setError(""); onStateChange({ ...state, result: null }); setSaved(false);
    try {
      const r = await fetch("/api/analyse", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ nom: nom.trim(), ville: ville.trim(), url: url.trim()||undefined, businessId }) });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Erreur"); return; }
      onStateChange({ ...state, result: data });
    } catch { setError("Erreur réseau."); }
    finally { setLoading(false); }
  };

  const addToCRM = async () => {
    if (!result) return; setSaving(true);
    const notes = result.phrases_accroche.map((p,i) => `${i+1}. ${p}`).join("\n");
    const fakeBusiness = { place_id:`analyse-${Date.now()}`, name:result.entreprise_nom, address:result.entreprise_adresse, phone:undefined, types:["analyse_ia"], lat:0, lng:0, hasWebsite:result.a_site_web, website:result.site_web_url, isOpen:null };
    const r = await fetch("/api/crm", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ business:fakeBusiness, businessId }) });
    if (r.ok) {
      const data = await r.json();
      if (data?.id) await fetch(`/api/crm/${data.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ note:`Score IA: ${result.score_prospection}/10\n\nPhrases d'accroche:\n${notes}\n\nConseil: ${result.conseil_global}`, analyse_score:result.score_prospection, analyse_result:result }) });
    }
    setSaving(false); setSaved(true);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div className="card">
        <div className="card-header"><div style={{ fontWeight:700, fontSize:14 }}>🤖 Analyse Prospect IA</div><div style={{ fontSize:12, color:"var(--muted)" }}>Entrez les infos d'un prospect pour générer vos phrases d'accroche</div></div>
        <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><label style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 }}>Nom de l'entreprise *</label><input className="input" value={nom} onChange={(e) => onStateChange({...state, nom:e.target.value})} placeholder="Ex: Agence Dupont Immobilier" onKeyDown={(e) => e.key==="Enter" && analyse()} /></div>
            <div><label style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 }}>Ville *</label><input className="input" value={ville} onChange={(e) => onStateChange({...state, ville:e.target.value})} placeholder="Ex: Lyon" onKeyDown={(e) => e.key==="Enter" && analyse()} /></div>
          </div>
          <div><label style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 }}>URL du site (optionnel)</label><input className="input" value={url} onChange={(e) => onStateChange({...state, url:e.target.value})} placeholder="https://..." type="url" /></div>
          {error && <div style={{ padding:"10px 14px", borderRadius:8, background:"var(--red-bg)", border:"1px solid rgba(239,68,68,0.2)", color:"var(--red)", fontSize:13 }}>⚠ {error}</div>}
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn btn-primary" onClick={analyse} disabled={loading || !nom.trim() || !ville.trim()} style={{ minWidth:160, justifyContent:"center" }}>{loading ? <><span className="spinner" /> Analyse…</> : "🔍 Analyser"}</button>
            {result && <button className="btn btn-ghost" onClick={() => { onStateChange({nom:"",ville:"",url:"",result:null}); setSaved(false); }}>Nouvelle analyse</button>}
          </div>
        </div>
      </div>
      {result && <AnalyseResultView result={result} onAddToCRM={addToCRM} saving={saving} saved={saved} />}
    </div>
  );
}

// ── Onglet B : Tableau de bord ─────────────────────────────────────────────────
function TabDashboard({ businessId }: { businessId: string }) {
  const [entries, setEntries] = useState<CRMEntry[]>([]);
  const [selected, setSelected] = useState<AnalyseResult | null>(null);

  useEffect(() => {
    fetch(`/api/crm?businessId=${businessId}`).then(r => r.json()).then((data: CRMEntry[]) => {
      setEntries(data.filter(e => e.analyse_score != null).sort((a,b) => (b.analyse_score||0) - (a.analyse_score||0)));
    });
  }, [businessId]);

  const avg = entries.length ? Math.round(entries.reduce((s,e) => s+(e.analyse_score||0), 0)/entries.length*10)/10 : 0;
  const top = entries.filter(e => (e.analyse_score||0) >= 7);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { label:"Prospects analysés", val:entries.length, color:"var(--accent-light)", bg:"var(--accent-bg)", border:"var(--accent-border)" },
          { label:"Score moyen", val:avg+"/10", color:"#facc15", bg:"rgba(250,204,21,0.1)", border:"rgba(250,204,21,0.25)" },
          { label:"Haute priorité", val:top.length, color:"#22c55e", bg:"rgba(34,197,94,0.1)", border:"rgba(34,197,94,0.25)" },
        ].map(s => (
          <div key={s.label} style={{ padding:"18px 20px", borderRadius:12, background:s.bg, border:`1px solid ${s.border}`, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.val}</span>
            <span style={{ fontSize:12, color:"var(--muted)", fontWeight:500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="card empty"><div className="empty-icon">📊</div><div className="empty-text">Aucun prospect analysé. Utilisez l'Analyse manuelle ou le bouton 🤖 dans le CRM.</div></div>
      ) : (
        <div className="card">
          <div className="card-header"><div style={{ fontWeight:700, fontSize:14 }}>Historique des analyses (du plus urgent)</div></div>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {entries.map((e, i) => (
              <div key={e.id} style={{ padding:"14px 20px", borderBottom: i < entries.length-1 ? "1px solid var(--border)" : "none", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}
                onClick={() => setSelected(e.analyse_result || null)}
                onMouseEnter={el => (el.currentTarget.style.background="rgba(255,255,255,0.02)")}
                onMouseLeave={el => (el.currentTarget.style.background="transparent")}>
                <div style={{ width:42, height:42, borderRadius:10, background:scoreBg(e.analyse_score||0), border:`1px solid ${scoreBorder(e.analyse_score||0)}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color:scoreColor(e.analyse_score||0), flexShrink:0 }}>{e.analyse_score}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{e.business.name}</div>
                  <div style={{ fontSize:12, color:"var(--muted)" }}>{e.business.address}</div>
                </div>
                <span style={{ fontSize:11, color:"var(--muted)" }}>{new Date(e.added_at).toLocaleDateString("fr-FR")}</span>
                <span style={{ fontSize:13, color:"var(--accent-light)" }}>Voir →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal résultat */}
      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={() => setSelected(null)}>
          <div style={{ background:"var(--surface)", borderRadius:16, maxWidth:720, width:"100%", maxHeight:"85vh", overflowY:"auto", padding:24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:16 }}>Résultat de l'analyse</div>
              <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm">✕ Fermer</button>
            </div>
            <AnalyseResultView result={selected} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Onglet C : Analyse par lot ─────────────────────────────────────────────────
function TabBatch({ businessId }: { businessId: string }) {
  const [entries, setEntries] = useState<CRMEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Map<string, AnalyseResult>>(new Map());
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState(0);

  useEffect(() => {
    fetch(`/api/crm?businessId=${businessId}`).then(r=>r.json()).then((data: CRMEntry[]) => {
      setEntries(data.filter(e => !e.analyse_score));
    });
  }, [businessId]);

  const toggle = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const runBatch = async () => {
    const toAnalyse = entries.filter(e => selected.has(e.id));
    setDone(0);
    for (const entry of toAnalyse) {
      setLoading(entry.id);
      const city = entry.business.address.split(" ").slice(-2).join(" ") || "France";
      const r = await fetch("/api/analyse", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ nom:entry.business.name, ville:city, businessId }) });
      if (r.ok) {
        const data: AnalyseResult = await r.json();
        setResults(p => new Map(p).set(entry.id, data));
        await fetch(`/api/crm/${entry.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ analyse_score:data.score_prospection, analyse_result:data }) });
      }
      setDone(p => p+1);
    }
    setLoading(null);
    setSelected(new Set());
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="card">
        <div className="card-header">
          <div><div style={{ fontWeight:700, fontSize:14 }}>⚡ Analyse par lot</div><div style={{ fontSize:12, color:"var(--muted)" }}>Sélectionnez des leads CRM à analyser en une fois</div></div>
          {selected.size > 0 && (
            <button onClick={runBatch} disabled={!!loading} className="btn btn-primary">
              {loading ? <><span className="spinner" /> {done}/{selected.size}</> : `🔍 Analyser ${selected.size} leads`}
            </button>
          )}
        </div>
        {entries.length === 0 ? (
          <div className="empty" style={{ padding:"32px 20px" }}><div className="empty-icon">✅</div><div className="empty-text">Tous vos leads ont déjà été analysés !</div></div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column" }}>
            {entries.map((e, i) => {
              const res = results.get(e.id);
              return (
                <div key={e.id} style={{ padding:"12px 20px", borderBottom: i < entries.length-1 ? "1px solid var(--border)" : "none", display:"flex", alignItems:"center", gap:12 }}>
                  <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} style={{ width:16, height:16, cursor:"pointer", accentColor:"var(--accent)" }} />
                  {loading === e.id && <span className="spinner" style={{ width:16, height:16, flexShrink:0 }} />}
                  {res && <span style={{ width:32, height:32, borderRadius:8, background:scoreBg(res.score_prospection), border:`1px solid ${scoreBorder(res.score_prospection)}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, color:scoreColor(res.score_prospection), flexShrink:0 }}>{res.score_prospection}</span>}
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{e.business.name}</div>
                    <div style={{ fontSize:11, color:"var(--muted)" }}>{e.business.address}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Onglet D : Script d'appel ──────────────────────────────────────────────────
function TabScript({ businessId }: { businessId: string }) {
  const [sector, setSector] = useState("real_estate");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<{ intro: string; arguments: string[]; objections: {obj:string;rep:string}[]; conclusion: string } | null>(null);
  const [copied, setCopied] = useState<string|null>(null);

  const generate = async () => {
    setLoading(true); setScript(null);
    const sectorLabel = SECTOR_SCRIPTS.find(s=>s.id===sector)?.label || sector;
    const r = await fetch("/api/analyse/script", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ sector:sectorLabel, context, businessId }) });
    if (r.ok) setScript(await r.json());
    setLoading(false);
  };

  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(()=>setCopied(null), 1500); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:720 }}>
      <div className="card">
        <div className="card-header"><div style={{ fontWeight:700, fontSize:14 }}>📞 Générateur de script d'appel</div></div>
        <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 }}>Secteur cible</label>
            <select className="input" value={sector} onChange={e=>setSector(e.target.value)} style={{ width:"auto" }}>
              {SECTOR_SCRIPTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:6 }}>Contexte supplémentaire (optionnel)</label>
            <textarea className="input" value={context} onChange={e=>setContext(e.target.value)} placeholder="Ex: l'agence utilise des descriptions très courtes et génériques..." rows={3} style={{ resize:"vertical", fontFamily:"inherit" }} />
          </div>
          <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ alignSelf:"flex-start", minWidth:200, justifyContent:"center" }}>
            {loading ? <><span className="spinner" /> Génération…</> : "✨ Générer le script"}
          </button>
        </div>
      </div>

      {script && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Introduction */}
          <div className="card">
            <div className="card-header"><div style={{ fontWeight:700, fontSize:14 }}>👋 Introduction</div><button onClick={()=>copy(script.intro,"intro")} className="btn btn-ghost btn-sm">{copied==="intro"?"✓ Copié":"Copier"}</button></div>
            <div className="card-body"><p style={{ margin:0, fontSize:14, lineHeight:1.7, fontStyle:"italic", color:"var(--muted)" }}>"{script.intro}"</p></div>
          </div>

          {/* Arguments */}
          <div className="card">
            <div className="card-header"><div style={{ fontWeight:700, fontSize:14 }}>💡 Arguments clés</div></div>
            <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {script.arguments.map((a,i)=>(
                <div key={i} style={{ display:"flex", gap:10, padding:"10px 14px", borderRadius:10, background:"var(--accent-bg)", border:"1px solid var(--accent-border)" }}>
                  <span style={{ color:"var(--accent-light)", fontWeight:800, flexShrink:0 }}>{i+1}.</span>
                  <span style={{ fontSize:13 }}>{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Objections */}
          <div className="card">
            <div className="card-header"><div style={{ fontWeight:700, fontSize:14 }}>🛡️ Objections & réponses</div></div>
            <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {script.objections.map((o,i)=>(
                <div key={i} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ padding:"8px 12px", borderRadius:8, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)", fontSize:13, color:"var(--muted)" }}>❓ "{o.obj}"</div>
                  <div style={{ padding:"8px 12px", borderRadius:8, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.15)", fontSize:13 }}>✅ {o.rep}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Conclusion */}
          <div className="card">
            <div className="card-header"><div style={{ fontWeight:700, fontSize:14 }}>🎯 Conclusion</div><button onClick={()=>copy(script.conclusion,"conclusion")} className="btn btn-ghost btn-sm">{copied==="conclusion"?"✓ Copié":"Copier"}</button></div>
            <div className="card-body"><p style={{ margin:0, fontSize:14, lineHeight:1.7, fontStyle:"italic", color:"var(--muted)" }}>"{script.conclusion}"</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Onglet E : Statistiques ────────────────────────────────────────────────────
function TabStats({ businessId }: { businessId: string }) {
  const [entries, setEntries] = useState<CRMEntry[]>([]);

  useEffect(() => {
    fetch(`/api/crm?businessId=${businessId}`).then(r=>r.json()).then(setEntries);
  }, [businessId]);

  const analysed = entries.filter(e=>e.analyse_score!=null);
  const total = entries.length;
  const signed = entries.filter(e=>e.status==="signe").length;
  const contacted = entries.filter(e=>["contacte","interesse","signe"].includes(e.status)).length;
  const convRate = total ? Math.round(signed/total*100) : 0;
  const contactRate = total ? Math.round(contacted/total*100) : 0;

  // Distribution des scores
  const dist = [
    { label:"1-3 (Bas)", count: analysed.filter(e=>(e.analyse_score||0)<=3).length, color:"#ef4444", bg:"rgba(239,68,68,0.1)" },
    { label:"4-6 (Moyen)", count: analysed.filter(e=>{const s=e.analyse_score||0;return s>=4&&s<=6;}).length, color:"#f59e0b", bg:"rgba(245,158,11,0.1)" },
    { label:"7-10 (Haute)", count: analysed.filter(e=>(e.analyse_score||0)>=7).length, color:"#22c55e", bg:"rgba(34,197,94,0.1)" },
  ];
  const maxDist = Math.max(...dist.map(d=>d.count), 1);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"Total leads",       val:total,        color:"var(--accent-light)", bg:"var(--accent-bg)",        border:"var(--accent-border)" },
          { label:"Analysés par IA",   val:analysed.length, color:"#a78bfa",          bg:"rgba(167,139,250,0.1)",  border:"rgba(167,139,250,0.25)" },
          { label:"Taux de contact",   val:contactRate+"%", color:"#60a5fa",          bg:"rgba(96,165,250,0.1)",   border:"rgba(96,165,250,0.25)" },
          { label:"Taux de conversion",val:convRate+"%", color:"#22c55e",             bg:"rgba(34,197,94,0.1)",    border:"rgba(34,197,94,0.25)" },
        ].map(s=>(
          <div key={s.label} style={{ padding:"18px 20px", borderRadius:12, background:s.bg, border:`1px solid ${s.border}`, display:"flex", flexDirection:"column", gap:8 }}>
            <span style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.val}</span>
            <span style={{ fontSize:12, color:"var(--muted)", fontWeight:500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Distribution scores */}
      {analysed.length > 0 && (
        <div className="card">
          <div className="card-header"><div style={{ fontWeight:700, fontSize:14 }}>Distribution des scores IA</div></div>
          <div className="card-body" style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {dist.map(d=>(
              <div key={d.label} style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--muted)", width:90, flexShrink:0 }}>{d.label}</span>
                <div style={{ flex:1, height:24, borderRadius:6, background:"var(--surface2)", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:6, background:d.color, opacity:0.7, width:`${(d.count/maxDist)*100}%`, transition:"width 0.5s ease" }} />
                </div>
                <span style={{ fontSize:14, fontWeight:700, color:d.color, width:30, textAlign:"right", flexShrink:0 }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statuts */}
      <div className="card">
        <div className="card-header"><div style={{ fontWeight:700, fontSize:14 }}>Répartition par statut</div></div>
        <div className="card-body" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
          {[
            {s:"nouveau",       l:"Nouveau"},
            {s:"contacte",      l:"Contacté"},
            {s:"interesse",     l:"Intéressé"},
            {s:"signe",         l:"Signé"},
            {s:"pas_interesse", l:"Pas intéressé"},
            {s:"nrp",           l:"NRP"},
          ].map(({s,l})=>{
            const n = entries.filter(e=>e.status===s).length;
            const pct = total ? Math.round(n/total*100) : 0;
            return (
              <div key={s} style={{ padding:"12px 14px", borderRadius:10, background:"var(--surface2)", border:"1px solid var(--border)", textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:800, color:"var(--text)", marginBottom:4 }}>{n}</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:11, color:"var(--accent-light)", fontWeight:600 }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function AnalysePage({ businessId = "gensite", state, onStateChange }: Props) {
  const [tab, setTab] = useState("manuel");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Onglets */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"8px 16px", borderRadius:10, border:"1px solid",
            borderColor: tab===t.id ? "var(--accent-border)" : "var(--border)",
            background:  tab===t.id ? "var(--accent-bg)"    : "transparent",
            color:       tab===t.id ? "var(--accent-light)" : "var(--muted)",
            fontSize:13, fontWeight: tab===t.id ? 700 : 400, cursor:"pointer",
            display:"flex", alignItems:"center", gap:6,
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {tab === "manuel"    && <TabManuel businessId={businessId} state={state} onStateChange={onStateChange} />}
      {tab === "dashboard" && <TabDashboard businessId={businessId} />}
      {tab === "batch"     && <TabBatch businessId={businessId} />}
      {tab === "script"    && <TabScript businessId={businessId} />}
      {tab === "stats"     && <TabStats businessId={businessId} />}
    </div>
  );
}
