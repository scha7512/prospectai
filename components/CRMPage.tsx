"use client";

import { useState, useEffect } from "react";
import { CRMEntry } from "@/lib/storage";

const STATUSES: { value: CRMEntry["status"]; label: string; color: string; bg: string; border: string }[] = [
  { value: "nouveau",       label: "Nouveau",        color: "#818cf8", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)"  },
  { value: "contacte",      label: "Contacté",       color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)"  },
  { value: "interesse",     label: "Intéressé",      color: "#facc15", bg: "rgba(250,204,21,0.12)",  border: "rgba(250,204,21,0.3)"  },
  { value: "signe",         label: "Signé ✓",        color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)"  },
  { value: "pas_interesse", label: "Pas intéressé",  color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
  { value: "nrp",           label: "NRP",            color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.25)"},
  { value: "faux_lead",     label: "Faux lead",      color: "#fb923c", bg: "rgba(251,146,60,0.1)",   border: "rgba(251,146,60,0.25)" },
  { value: "faux_num",      label: "Faux num",       color: "#e879f9", bg: "rgba(232,121,249,0.1)",  border: "rgba(232,121,249,0.25)"},
  { value: "ferme",         label: "Fermé",          color: "#64748b", bg: "rgba(100,116,139,0.1)",  border: "rgba(100,116,139,0.25)"},
  { value: "deja_installe", label: "Déjà installé",  color: "#2dd4bf", bg: "rgba(45,212,191,0.1)",   border: "rgba(45,212,191,0.25)" },
];

const JOURS = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MOIS  = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function formatRappel(iso: string) {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const dDay  = new Date(d); dDay.setHours(0,0,0,0);
  return {
    text: `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} à ${String(d.getHours()).padStart(2,"0")}h${String(d.getMinutes()).padStart(2,"0")}`,
    isPast:  dDay < today,
    isToday: dDay.getTime() === today.getTime(),
  };
}

type EntryWithId = CRMEntry & { id: string };

interface DBEntry {
  id: string; business: CRMEntry["business"]; status: CRMEntry["status"];
  note: string; rappel_at: string | null; rappel_direction: CRMEntry["rappelDirection"];
  site_cree: boolean; added_at: string;
}

export default function CRMPage({ businessId = "gensite" }: { businessId?: string }) {
  const [entries, setEntries]           = useState<EntryWithId[]>([]);
  const [filterStatus, setFilterStatus] = useState<CRMEntry["status"] | "all" | "a_rappeler" | "ils_rappellent">("all");
  const [editNote, setEditNote]         = useState<string | null>(null);
  const [noteVal, setNoteVal]           = useState("");
  const [editRappel, setEditRappel]     = useState<string | null>(null);
  const [rappelVal, setRappelVal]       = useState("");
  const [copiedPhone, setCopiedPhone]   = useState<string | null>(null);

  const reload = async () => {
    const r = await fetch(`/api/crm?businessId=${businessId}`);
    if (!r.ok) return;
    const data: DBEntry[] = await r.json();
    setEntries(data.map((e) => ({
      id: e.id, business: e.business, status: e.status, note: e.note,
      rappelAt: e.rappel_at, rappelDirection: e.rappel_direction,
      siteCree: e.site_cree, addedAt: e.added_at, updatedAt: e.added_at,
    })));
  };
  useEffect(() => { reload(); }, []);

  const patch = async (id: string, data: Partial<Pick<CRMEntry,"status"|"note"|"rappelAt"|"rappelDirection"|"siteCree">>) => {
    const db: Record<string,unknown> = {};
    if (data.status        !== undefined) db.status           = data.status;
    if (data.note          !== undefined) db.note             = data.note;
    if (data.rappelAt      !== undefined) db.rappel_at        = data.rappelAt;
    if (data.rappelDirection !== undefined) db.rappel_direction = data.rappelDirection;
    if (data.siteCree      !== undefined) db.site_cree        = data.siteCree;
    setEntries((p) => p.map((e) => e.id === id ? { ...e, ...data } : e));
    await fetch(`/api/crm/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(db) });
  };

  const remove = async (id: string) => {
    setEntries((p) => p.filter((e) => e.id !== id));
    await fetch(`/api/crm/${id}`, { method:"DELETE" });
  };

  const copyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(id); setTimeout(() => setCopiedPhone(null), 1500);
  };

  const openMaps = (name: string, addr: string) =>
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name+" "+addr)}`, "_blank");

  /* ── Tri & filtres ────────────────────────────────────────────────────── */
  const filtered = (
    filterStatus === "all"           ? entries
    : filterStatus === "a_rappeler"  ? entries.filter((e) => e.rappelAt && e.rappelDirection === "je_rappelle")
    : filterStatus === "ils_rappellent" ? entries.filter((e) => e.rappelDirection === "ils_rappellent")
    : entries.filter((e) => e.status === filterStatus)
  ).sort((a,b) => {
    if (a.rappelAt && b.rappelAt) return new Date(a.rappelAt).getTime() - new Date(b.rappelAt).getTime();
    if (a.rappelAt) return -1; if (b.rappelAt) return 1;
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });

  const counts = {
    a_rappeler:    entries.filter((e) => e.rappelAt && e.rappelDirection === "je_rappelle").length,
    ils_rappellent: entries.filter((e) => e.rappelDirection === "ils_rappellent").length,
  };

  /* ── Rendu ────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Barre de filtres ── */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>

        {/* Tout */}
        <button onClick={() => setFilterStatus("all")} style={{
          padding:"6px 14px", borderRadius:20, border:"1px solid",
          borderColor: filterStatus==="all" ? "rgba(255,255,255,0.3)" : "var(--border)",
          background: filterStatus==="all" ? "rgba(255,255,255,0.08)" : "transparent",
          color: filterStatus==="all" ? "var(--text)" : "var(--muted)",
          fontSize:12, fontWeight:600, cursor:"pointer",
        }}>Tous · {entries.length}</button>

        {/* Rappels */}
        {[
          { k:"a_rappeler",    label:"📞 À rappeler",      color:"#60a5fa", bg:"rgba(96,165,250,0.1)",   border:"rgba(96,165,250,0.3)",  n: counts.a_rappeler },
          { k:"ils_rappellent",label:"📲 Ils rappellent",  color:"#a78bfa", bg:"rgba(167,139,250,0.1)",  border:"rgba(167,139,250,0.3)", n: counts.ils_rappellent },
        ].map((f) => (
          <button key={f.k} onClick={() => setFilterStatus(f.k as typeof filterStatus)} style={{
            padding:"6px 14px", borderRadius:20, border:"1px solid",
            borderColor: filterStatus===f.k ? f.border : "var(--border)",
            background:  filterStatus===f.k ? f.bg     : "transparent",
            color:       filterStatus===f.k ? f.color  : "var(--muted)",
            fontSize:12, fontWeight:600, cursor:"pointer",
          }}>{f.label} · {f.n}</button>
        ))}

        <div style={{ width:1, height:20, background:"var(--border)", margin:"0 4px" }} />

        {/* Statuts */}
        {STATUSES.map((s) => {
          const n = entries.filter((e) => e.status === s.value).length;
          if (n === 0) return null;
          return (
            <button key={s.value} onClick={() => setFilterStatus(s.value)} style={{
              padding:"6px 12px", borderRadius:20, border:"1px solid",
              borderColor: filterStatus===s.value ? s.border : "var(--border)",
              background:  filterStatus===s.value ? s.bg     : "transparent",
              color:       filterStatus===s.value ? s.color  : "var(--muted)",
              fontSize:12, fontWeight:600, cursor:"pointer",
            }}>{s.label} · {n}</button>
          );
        })}
      </div>

      {/* ── Vide ── */}
      {filtered.length === 0 && (
        <div className="card empty">
          <div className="empty-icon">📋</div>
          <div className="empty-text">
            {entries.length === 0 ? "Aucun lead dans le CRM.\nAjoutez-en depuis la Recherche." : "Aucun lead avec ce filtre."}
          </div>
        </div>
      )}

      {/* ── Cards ── */}
      {filtered.map((entry) => {
        const st     = STATUSES.find((s) => s.value === entry.status) || STATUSES[0];
        const b      = entry.business;
        const rappel = entry.rappelAt ? formatRappel(entry.rappelAt) : null;
        const accentLeft = rappel?.isPast ? "#f87171" : rappel?.isToday ? "#facc15" : rappel ? "#60a5fa" : "var(--border)";

        return (
          <div key={entry.id} style={{
            background:"var(--surface)", borderRadius:14,
            border:"1px solid var(--border)", borderLeft:`3px solid ${accentLeft}`,
            overflow:"hidden",
          }}>
            {/* ── Ligne 1 : infos + statut + actions ── */}
            <div style={{ padding:"16px 20px", display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>

              {/* Infos principales */}
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:6 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>{b.name}</span>
                  {b.types[0] && (
                    <span style={{ fontSize:11, padding:"2px 7px", borderRadius:6, background:"var(--accent-bg)", color:"var(--accent-light)", fontWeight:500 }}>
                      {b.types[0]}
                    </span>
                  )}
                </div>
                <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                  {b.address && (
                    <span style={{ fontSize:12, color:"var(--muted)", display:"flex", alignItems:"center", gap:4 }}>
                      📍 {b.address}
                    </span>
                  )}
                  {b.phone && (
                    <button onClick={() => copyPhone(b.phone!, entry.id)} style={{
                      background:"none", border:"none", cursor:"pointer", padding:0,
                      fontSize:12, fontWeight:600,
                      color: copiedPhone===entry.id ? "var(--green)" : "var(--text)",
                      display:"flex", alignItems:"center", gap:4,
                    }}>
                      📞 {copiedPhone===entry.id ? "Copié !" : b.phone}
                    </button>
                  )}
                </div>
              </div>

              {/* Statut — sélecteur pill */}
              <select value={entry.status} onChange={(e) => patch(entry.id, { status: e.target.value as CRMEntry["status"] })}
                style={{
                  padding:"6px 10px", borderRadius:20, border:`1px solid ${st.border}`,
                  background:st.bg, color:st.color, fontSize:12, fontWeight:700,
                  cursor:"pointer", outline:"none", flexShrink:0,
                }}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>

              {/* Site créé */}
              <button onClick={() => patch(entry.id, { siteCree: !entry.siteCree })} style={{
                display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                padding:"10px 14px", borderRadius:12, border:"2px solid", cursor:"pointer", transition:"all 0.15s", flexShrink:0,
                borderColor: entry.siteCree ? "#4ade80" : "var(--border2)",
                background:  entry.siteCree ? "rgba(74,222,128,0.1)" : "var(--surface2)",
              }}>
                <span style={{ fontSize:24 }}>{entry.siteCree ? "✅" : "🌐"}</span>
                <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", color: entry.siteCree ? "#4ade80" : "var(--dim)" }}>
                  {entry.siteCree ? "Site créé" : "Sans site"}
                </span>
              </button>

              {/* Actions */}
              <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                <button onClick={() => openMaps(b.name, b.address)} className="btn btn-ghost btn-sm">📍 Maps</button>
                <button onClick={() => remove(entry.id)} className="btn btn-danger btn-sm">🗑 Retirer</button>
              </div>
            </div>

            {/* ── Ligne 2 : rappel + direction + note ── */}
            <div style={{ borderTop:"1px solid var(--border)", padding:"12px 20px", display:"flex", gap:12, alignItems:"flex-start", flexWrap:"wrap", background:"var(--surface2)" }}>

              {/* Rappel */}
              <div style={{ display:"flex", flexDirection:"column", gap:6, minWidth:180 }}>
                <span style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>📅 Rappel</span>

                {editRappel === entry.id ? (
                  <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                    <input type="datetime-local" value={rappelVal} onChange={(e) => setRappelVal(e.target.value)}
                      className="input" style={{ fontSize:12, padding:"5px 8px", width:"auto" }} />
                    <button className="btn btn-primary btn-sm" onClick={() => { patch(entry.id, { rappelAt: rappelVal ? new Date(rappelVal).toISOString() : null }); setEditRappel(null); }}>✓</button>
                    {entry.rappelAt && <button className="btn btn-danger btn-sm" onClick={() => { patch(entry.id, { rappelAt: null }); setEditRappel(null); }}>Suppr.</button>}
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditRappel(null)}>✕</button>
                  </div>
                ) : rappel ? (
                  <button onClick={() => { setEditRappel(entry.id); setRappelVal(entry.rappelAt!.slice(0,16)); }} style={{
                    display:"inline-flex", alignItems:"center", gap:8, cursor:"pointer",
                    padding:"6px 12px", borderRadius:10, border:"1px solid", background:"none",
                    borderColor: rappel.isPast ? "rgba(248,113,113,0.4)" : rappel.isToday ? "rgba(250,204,21,0.4)" : "rgba(96,165,250,0.3)",
                  }}>
                    <span style={{ fontSize:13, fontWeight:700, color: rappel.isPast ? "#f87171" : rappel.isToday ? "#facc15" : "#60a5fa" }}>
                      {rappel.text}
                    </span>
                    {rappel.isPast  && <span style={{ fontSize:10, background:"rgba(248,113,113,0.2)", color:"#f87171", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>EN RETARD</span>}
                    {rappel.isToday && <span style={{ fontSize:10, background:"rgba(250,204,21,0.2)",  color:"#facc15",  borderRadius:4, padding:"1px 5px", fontWeight:700 }}>AUJOURD'HUI</span>}
                  </button>
                ) : (
                  <button onClick={() => { setEditRappel(entry.id); setRappelVal(""); }} style={{
                    display:"inline-flex", alignItems:"center", gap:6, cursor:"pointer",
                    padding:"5px 10px", borderRadius:8, border:"1px dashed var(--border2)", background:"none",
                    color:"var(--dim)", fontSize:12,
                  }}>+ Fixer une date</button>
                )}

                {/* Direction */}
                <div style={{ display:"flex", gap:6 }}>
                  {(["je_rappelle","ils_rappellent"] as const).map((v) => {
                    const active = entry.rappelDirection === v;
                    return (
                      <button key={v} onClick={() => patch(entry.id, { rappelDirection: active ? null : v })} style={{
                        padding:"4px 10px", borderRadius:20, border:"1px solid", fontSize:11, fontWeight:600, cursor:"pointer",
                        borderColor: active ? (v==="je_rappelle" ? "rgba(96,165,250,0.4)" : "rgba(167,139,250,0.4)") : "var(--border)",
                        background:  active ? (v==="je_rappelle" ? "rgba(96,165,250,0.1)" : "rgba(167,139,250,0.1)") : "transparent",
                        color:       active ? (v==="je_rappelle" ? "#60a5fa" : "#a78bfa") : "var(--muted)",
                      }}>
                        {v === "je_rappelle" ? "📞 Je rappelle" : "📲 Ils rappellent"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Séparateur */}
              <div style={{ width:1, background:"var(--border)", alignSelf:"stretch", margin:"0 4px" }} />

              {/* Note */}
              <div style={{ flex:1, minWidth:200 }}>
                <span style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>✏️ Note</span>
                {editNote === entry.id ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <textarea autoFocus value={noteVal} onChange={(e) => setNoteVal(e.target.value)} rows={2}
                      placeholder="Votre note…" style={{
                        background:"var(--surface)", border:"1px solid var(--accent)", borderRadius:8,
                        color:"var(--text)", fontSize:13, padding:"8px 10px", outline:"none",
                        resize:"vertical", fontFamily:"inherit", width:"100%",
                      }} />
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => { patch(entry.id, { note: noteVal }); setEditNote(null); }}>Sauvegarder</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditNote(null)}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setEditNote(entry.id); setNoteVal(entry.note || ""); }} style={{
                    width:"100%", textAlign:"left", background: entry.note ? "var(--surface)" : "transparent",
                    border:"1px dashed var(--border2)", borderRadius:8, cursor:"pointer",
                    color: entry.note ? "var(--text)" : "var(--dim)",
                    fontSize:13, padding:"8px 10px", fontFamily:"inherit", lineHeight:1.5,
                  }}>
                    {entry.note || "Ajouter une note…"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
