"use client";

import { useState, useEffect } from "react";
import { CRMEntry } from "@/lib/storage";
import { AnalyseResult } from "@/app/api/analyse/route";

const scoreColor  = (s: number) => s >= 7 ? "#22c55e" : s >= 5 ? "#f59e0b" : "#ef4444";
const scoreBg     = (s: number) => s >= 7 ? "rgba(34,197,94,0.1)" : s >= 5 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";
const scoreBorder = (s: number) => s >= 7 ? "rgba(34,197,94,0.3)" : s >= 5 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)";
const scoreLabel  = (s: number) => s >= 7 ? "Priorité haute" : s >= 5 ? "Priorité moyenne" : "Priorité basse";

function AnalyseResultMini({ result }: { result: AnalyseResult }) {
  const [copied, setCopied] = useState<number | null>(null);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Score */}
      <div style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 18px", borderRadius:12, background:scoreBg(result.score_prospection), border:`1.5px solid ${scoreBorder(result.score_prospection)}` }}>
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div style={{ fontSize:36, fontWeight:900, color:scoreColor(result.score_prospection), lineHeight:1 }}>{result.score_prospection}</div>
          <div style={{ fontSize:10, color:scoreColor(result.score_prospection), fontWeight:700 }}>/10</div>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:scoreColor(result.score_prospection), textTransform:"uppercase", letterSpacing:"0.06em" }}>{scoreLabel(result.score_prospection)}</div>
          <div style={{ fontSize:13, color:"var(--text)", marginTop:4 }}>{result.raison_score}</div>
        </div>
      </div>
      {/* Problèmes */}
      {result.problemes_detectes?.length > 0 && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>⚠️ Problèmes détectés</div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {result.problemes_detectes.map((p, i) => (
              <div key={i} style={{ fontSize:13, color:"var(--text)", padding:"6px 10px", borderRadius:8, background:"var(--surface2)", borderLeft:"2px solid rgba(239,68,68,0.4)" }}>{p}</div>
            ))}
          </div>
        </div>
      )}
      {/* Phrases */}
      {result.phrases_accroche?.length > 0 && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>💬 Phrases d&apos;accroche</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {result.phrases_accroche.map((p, i) => (
              <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"8px 10px", borderRadius:8, background:"var(--surface2)" }}>
                <span style={{ fontSize:12, color:"var(--text)", flex:1, lineHeight:1.5 }}>{p}</span>
                <button onClick={() => { navigator.clipboard.writeText(p); setCopied(i); setTimeout(() => setCopied(null), 1500); }} style={{
                  background:"none", border:"1px solid var(--border)", borderRadius:6, cursor:"pointer", padding:"2px 6px",
                  fontSize:11, color: copied===i ? "#22c55e" : "var(--muted)", flexShrink:0,
                }}>{copied===i ? "✓" : "Copier"}</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Conseil */}
      {result.conseil_global && (
        <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)", fontSize:13, color:"var(--text)", lineHeight:1.6 }}>
          💡 {result.conseil_global}
        </div>
      )}
    </div>
  );
}

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
  { value: "email_envoye", label: "Email envoyé",   color: "#38bdf8", bg: "rgba(56,189,248,0.1)",   border: "rgba(56,189,248,0.25)" },
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

interface EmailGenerated { subject: string; body: string; }
type EntryWithId = CRMEntry & { id: string; analyse_score?: number; analyse_result?: AnalyseResult; prospect_email?: string; email_generated?: EmailGenerated; email_sent?: boolean; };

interface DBEntry {
  id: string; business: CRMEntry["business"]; status: CRMEntry["status"];
  note: string; rappel_at: string | null; rappel_direction: CRMEntry["rappelDirection"];
  site_cree: boolean; added_at: string; analyse_score?: number; analyse_result?: AnalyseResult;
  prospect_email?: string; email_generated?: EmailGenerated; email_sent?: boolean;
}

export default function CRMPage({ businessId = "gensite" }: { businessId?: string }) {
  const [entries, setEntries]           = useState<EntryWithId[]>([]);
  const [filterStatus, setFilterStatus] = useState<CRMEntry["status"] | "all" | "a_rappeler" | "ils_rappellent">("all");
  const [editNote, setEditNote]         = useState<string | null>(null);
  const [noteVal, setNoteVal]           = useState("");
  const [editRappel, setEditRappel]     = useState<string | null>(null);
  const [rappelVal, setRappelVal]       = useState("");
  const [copiedPhone, setCopiedPhone]   = useState<string | null>(null);
  const [analyseModal, setAnalyseModal] = useState<EntryWithId | null>(null);
  const [analyseLoading, setAnalyseLoading] = useState(false);
  const [emailModal, setEmailModal]     = useState<EntryWithId | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailInputs, setEmailInputs]   = useState<Record<string, string>>({});
  const [copiedEmail, setCopiedEmail]   = useState(false);
  const [scrapedEmails, setScrapedEmails] = useState<Record<string, string | null | "loading">>({});
  const [addedToGensite, setAddedToGensite] = useState<Record<string, boolean>>({});
  const [emailSendingDirect, setEmailSendingDirect] = useState<Record<string, boolean>>({});

  const reload = async () => {
    const r = await fetch(`/api/crm?businessId=${businessId}`);
    if (!r.ok) return;
    const data: DBEntry[] = await r.json();
    const mapped = data.map((e) => ({
      id: e.id, business: e.business, status: e.status, note: e.note,
      rappelAt: e.rappel_at, rappelDirection: e.rappel_direction,
      siteCree: e.site_cree, addedAt: e.added_at, updatedAt: e.added_at,
      analyse_score: e.analyse_score, analyse_result: e.analyse_result,
      prospect_email: e.prospect_email, email_generated: e.email_generated, email_sent: e.email_sent,
    }));
    setEntries(mapped);

    // Copywriting : scraping automatique pour les leads avec site et sans email (Promise.all)
    if (businessId === "copywriting") {
      const toScrape = mapped.filter((e) => e.business.website && !e.prospect_email);
      const alreadyHave = mapped.filter((e) => e.prospect_email);
      const noWebsite   = mapped.filter((e) => !e.business.website);
      const initState: Record<string, string | null | "loading"> = {};
      toScrape.forEach((e)    => { initState[e.id] = "loading"; });
      alreadyHave.forEach((e) => { initState[e.id] = e.prospect_email!; });
      noWebsite.forEach((e)   => { initState[e.id] = null; });
      setScrapedEmails(initState);
      Promise.all(
        toScrape.map(async (entry) => {
          try {
            const res = await fetch("/api/crm/scrape-email", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ website: entry.business.website }),
            });
            const { email } = await res.json();
            setScrapedEmails((p) => ({ ...p, [entry.id]: email ?? null }));
            if (email) {
              setEntries((p) => p.map((e) => e.id === entry.id ? { ...e, prospect_email: email } : e));
              await fetch(`/api/crm/${entry.id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prospect_email: email }),
              });
            }
          } catch {
            setScrapedEmails((p) => ({ ...p, [entry.id]: null }));
          }
        })
      );
    }
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

  const runAnalyse = async (entry: EntryWithId) => {
    // If already analysed, just open the modal
    if (entry.analyse_result) { setAnalyseModal(entry); return; }
    setAnalyseModal(entry);
    setAnalyseLoading(true);
    try {
      const addrParts = entry.business.address?.split(",") ?? [];
      const ville = addrParts.length > 1 ? addrParts[addrParts.length - 1].trim() : addrParts[0]?.trim() ?? "";
      const r = await fetch("/api/analyse", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ nom: entry.business.name, ville, url: entry.business.website ?? "", businessId }),
      });
      if (!r.ok) throw new Error("Erreur API");
      const result: AnalyseResult = await r.json();
      // Save to DB
      await fetch(`/api/crm/${entry.id}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ analyse_score: result.score_prospection, analyse_result: result }),
      });
      const updated = { ...entry, analyse_score: result.score_prospection, analyse_result: result };
      setEntries((p) => p.map((e) => e.id === entry.id ? updated : e));
      setAnalyseModal(updated);
    } catch {
      alert("Erreur lors de l'analyse.");
      setAnalyseModal(null);
    } finally {
      setAnalyseLoading(false);
    }
  };

  const patchRaw = async (id: string, data: Record<string, unknown>) => {
    await fetch(`/api/crm/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
  };

  const saveProspectEmail = async (entry: EntryWithId) => {
    const val = emailInputs[entry.id] ?? entry.prospect_email ?? "";
    setEntries((p) => p.map((e) => e.id === entry.id ? { ...e, prospect_email: val } : e));
    await patchRaw(entry.id, { prospect_email: val });
  };

  const sendToGensite = async (entry: EntryWithId) => {
    try {
      await fetch("/api/crm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business: entry.business, businessId: "gensite" }),
      });
      setAddedToGensite((p) => ({ ...p, [entry.id]: true }));
    } catch { /* silencieux */ }
  };

  const sendEmailDirect = async (entry: EntryWithId, email: string, force = false) => {
    if (entry.status === "email_envoye" && !force) return;
    setEmailSendingDirect((p) => ({ ...p, [entry.id]: true }));
    try {
      const sector = entry.business.types?.[0] || "";
      const r = await fetch("/api/crm/email/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: entry.business.name, sector, analyse_result: entry.analyse_result }),
      });
      const { subject, body } = await r.json();
      const gmailUrl = `https://mail.google.com/mail/?authuser=tantonsacha@gmail.com&view=cm&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(gmailUrl, "_blank");
      // Mettre à jour le statut vers email_envoye
      setEntries((p) => p.map((e) => e.id === entry.id ? { ...e, status: "email_envoye" } : e));
      await patchRaw(entry.id, { status: "email_envoye" });
    } catch { /* silencieux */ }
    finally { setEmailSendingDirect((p) => ({ ...p, [entry.id]: false })); }
  };

  const generateEmail = async (entry: EntryWithId) => {
    // Si déjà généré, ouvrir directement la modal
    if (entry.email_generated) { setEmailModal(entry); return; }
    setEmailModal(entry);
    setEmailLoading(true);
    try {
      const sector = entry.business.types?.[0] || "";
      const r = await fetch("/api/crm/email/generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ businessName: entry.business.name, sector, analyse_result: entry.analyse_result }),
      });
      if (!r.ok) throw new Error("Erreur API");
      const result: EmailGenerated = await r.json();
      await patchRaw(entry.id, { email_generated: result });
      const updated = { ...entry, email_generated: result };
      setEntries((p) => p.map((e) => e.id === entry.id ? updated : e));
      setEmailModal(updated);
    } catch {
      alert("Erreur lors de la génération de l'email.");
      setEmailModal(null);
    } finally {
      setEmailLoading(false);
    }
  };

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

      {/* ── Modal Analyse IA ── */}
      {analyseModal && (
        <div onClick={() => { if (!analyseLoading) setAnalyseModal(null); }} style={{
          position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:16,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background:"var(--surface)", borderRadius:16, border:"1px solid var(--border)",
            width:"100%", maxWidth:560, maxHeight:"85vh", overflow:"auto", padding:24,
            display:"flex", flexDirection:"column", gap:16,
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:"var(--text)" }}>🤖 Analyse IA</div>
                <div style={{ fontSize:13, color:"var(--muted)", marginTop:2 }}>{analyseModal.business.name}</div>
              </div>
              {!analyseLoading && (
                <button onClick={() => setAnalyseModal(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:20, lineHeight:1 }}>✕</button>
              )}
            </div>

            {analyseLoading ? (
              <div style={{ padding:"40px 0", textAlign:"center", color:"var(--muted)" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🤖</div>
                <div style={{ fontWeight:600 }}>Analyse en cours…</div>
                <div style={{ fontSize:12, marginTop:4 }}>Recherche d&apos;infos + analyse IA</div>
              </div>
            ) : analyseModal.analyse_result ? (
              <AnalyseResultMini result={analyseModal.analyse_result} />
            ) : null}
          </div>
        </div>
      )}

      {/* ── Modal Email ── */}
      {emailModal && (
        <div onClick={() => { if (!emailLoading) setEmailModal(null); }} style={{
          position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:16,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background:"var(--surface)", borderRadius:16, border:"1px solid var(--border)",
            width:"100%", maxWidth:580, maxHeight:"85vh", overflow:"auto", padding:24,
            display:"flex", flexDirection:"column", gap:16,
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:"var(--text)" }}>📧 Email de prospection</div>
                <div style={{ fontSize:13, color:"var(--muted)", marginTop:2 }}>{emailModal.business.name}</div>
              </div>
              {!emailLoading && (
                <button onClick={() => setEmailModal(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:20, lineHeight:1 }}>✕</button>
              )}
            </div>

            {emailLoading ? (
              <div style={{ padding:"40px 0", textAlign:"center", color:"var(--muted)" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>✍️</div>
                <div style={{ fontWeight:600 }}>Génération en cours…</div>
                <div style={{ fontSize:12, marginTop:4 }}>Rédaction de l&apos;email personnalisé</div>
              </div>
            ) : emailModal.email_generated ? (() => {
              const eg = emailModal.email_generated!;
              const prospectEmail = emailModal.prospect_email || emailInputs[emailModal.id] || "";
              const gmailUrl = `https://mail.google.com/mail/?authuser=tantonsacha@gmail.com&view=cm&to=${encodeURIComponent(prospectEmail)}&su=${encodeURIComponent(eg.subject)}&body=${encodeURIComponent(eg.body)}`;
              return (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {/* Objet */}
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Objet</div>
                    <div style={{ padding:"10px 14px", borderRadius:10, background:"var(--surface2)", border:"1px solid var(--border)", fontSize:14, fontWeight:600, color:"var(--text)" }}>
                      {eg.subject}
                    </div>
                  </div>
                  {/* Corps */}
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Corps</div>
                    <div style={{ padding:"12px 14px", borderRadius:10, background:"var(--surface2)", border:"1px solid var(--border)", fontSize:13, color:"var(--text)", lineHeight:1.7, whiteSpace:"pre-line" }}>
                      {eg.body}
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <button onClick={() => { navigator.clipboard.writeText(eg.body); setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 1500); }} style={{
                      padding:"8px 16px", borderRadius:8, border:"1px solid var(--border)", background:"var(--surface2)",
                      color: copiedEmail ? "#22c55e" : "var(--text)", fontSize:13, fontWeight:600, cursor:"pointer",
                    }}>
                      {copiedEmail ? "✓ Copié !" : "📋 Copier le corps"}
                    </button>
                    <a href={gmailUrl} target="_blank" rel="noopener noreferrer" onClick={() => {
                      const updated = { ...emailModal, email_sent: true };
                      setEntries((p) => p.map((e) => e.id === emailModal.id ? { ...e, email_sent: true } : e));
                      setEmailModal(updated);
                      patchRaw(emailModal.id, { email_sent: true });
                    }} style={{
                      padding:"8px 16px", borderRadius:8, border:"1px solid rgba(56,189,248,0.4)",
                      background:"rgba(56,189,248,0.1)", color:"#38bdf8",
                      fontSize:13, fontWeight:600, cursor:"pointer", textDecoration:"none", display:"flex", alignItems:"center", gap:6,
                    }}>
                      📬 Ouvrir dans Gmail
                    </a>
                    <button onClick={() => {
                      const updated = { ...emailModal, email_generated: undefined };
                      setEntries((p) => p.map((e) => e.id === emailModal.id ? { ...e, email_generated: undefined } : e));
                      patchRaw(emailModal.id, { email_generated: null });
                      setEmailModal(null);
                    }} style={{
                      padding:"8px 16px", borderRadius:8, border:"1px solid var(--border)", background:"transparent",
                      color:"var(--muted)", fontSize:12, cursor:"pointer",
                    }}>
                      🔄 Régénérer
                    </button>
                  </div>
                </div>
              );
            })() : null}
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
                  {/* Badge site web */}
                  {b.hasWebsite ? (
                    <span style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:"rgba(74,222,128,0.1)", color:"#4ade80", border:"1px solid rgba(74,222,128,0.25)", fontWeight:600 }}>
                      🌐 A un site
                    </span>
                  ) : (
                    <span style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:"rgba(248,113,113,0.1)", color:"#f87171", border:"1px solid rgba(248,113,113,0.25)", fontWeight:600 }}>
                      🚫 Sans site
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
                {businessId === "copywriting" && (
                  <button onClick={() => runAnalyse(entry)} style={{
                    padding:"5px 10px", borderRadius:8, border:"1px solid",
                    borderColor: entry.analyse_score ? (entry.analyse_score >= 7 ? "rgba(34,197,94,0.4)" : entry.analyse_score >= 5 ? "rgba(245,158,11,0.4)" : "rgba(239,68,68,0.4)") : "rgba(167,139,250,0.3)",
                    background:  entry.analyse_score ? (entry.analyse_score >= 7 ? "rgba(34,197,94,0.1)" : entry.analyse_score >= 5 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)") : "rgba(167,139,250,0.08)",
                    color:       entry.analyse_score ? (entry.analyse_score >= 7 ? "#22c55e" : entry.analyse_score >= 5 ? "#f59e0b" : "#ef4444") : "#a78bfa",
                    fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap",
                  }}>
                    🤖 {entry.analyse_score ? `Score ${entry.analyse_score}/10` : "Analyser"}
                  </button>
                )}
                {businessId === "copywriting" && !b.hasWebsite && (
                  <button onClick={() => sendToGensite(entry)} disabled={addedToGensite[entry.id]} style={{
                    padding:"5px 10px", borderRadius:8, border:"1px solid",
                    borderColor: addedToGensite[entry.id] ? "rgba(74,222,128,0.4)" : "rgba(99,102,241,0.4)",
                    background:  addedToGensite[entry.id] ? "rgba(74,222,128,0.08)" : "rgba(99,102,241,0.08)",
                    color:       addedToGensite[entry.id] ? "#4ade80" : "#818cf8",
                    fontSize:11, fontWeight:700, cursor: addedToGensite[entry.id] ? "default" : "pointer",
                    whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:4,
                  }}>
                    {addedToGensite[entry.id] ? "✓ Ajouté" : "🌐 → GenSite"}
                  </button>
                )}
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

            {/* ── Ligne 3 : Email (Copywriting seulement) ── */}
            {businessId === "copywriting" && (() => {
              const emailState   = scrapedEmails[entry.id];
              const isLoading    = emailState === "loading";
              const foundEmail   = typeof emailState === "string" && emailState !== "loading" ? emailState : (entry.prospect_email || null);
              const notFound     = !isLoading && !foundEmail;
              return (
                <div style={{ borderTop:"1px solid var(--border)", padding:"12px 20px", display:"flex", flexDirection:"column", gap:8, background:"var(--surface2)" }}>
                  {/* Ligne principale */}
                  <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", flexShrink:0 }}>📧 Email</span>

                    {/* État scraping */}
                    {isLoading && (
                      <span style={{ fontSize:11, color:"var(--muted)", display:"flex", alignItems:"center", gap:4 }}>🔍 Recherche email...</span>
                    )}
                    {foundEmail && (
                      <>
                        <span style={{ fontSize:12, color:"#4ade80", fontWeight:600 }}>{foundEmail}</span>
                        {entry.status === "email_envoye" ? (
                          <button onClick={() => sendEmailDirect(entry, foundEmail, true)} style={{
                            padding:"4px 10px", borderRadius:8, border:"1px solid rgba(74,222,128,0.4)",
                            background:"rgba(74,222,128,0.1)", color:"#4ade80",
                            fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
                          }}>✅ Mail envoyé</button>
                        ) : (
                          <button
                            onClick={() => sendEmailDirect(entry, foundEmail)}
                            disabled={emailSendingDirect[entry.id]}
                            style={{
                              padding:"4px 10px", borderRadius:8, border:"1px solid rgba(56,189,248,0.4)",
                              background:"rgba(56,189,248,0.08)", color:"#38bdf8",
                              fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
                              opacity: emailSendingDirect[entry.id] ? 0.6 : 1,
                            }}>
                            {emailSendingDirect[entry.id] ? "…" : "📧 Envoyer un mail"}
                          </button>
                        )}
                      </>
                    )}
                    {notFound && (
                      <>
                        <span style={{ fontSize:11, color:"#f87171" }}>Aucun email</span>
                        {b.phone && (
                          <button onClick={() => copyPhone(b.phone!, entry.id)} style={{
                            padding:"4px 10px", borderRadius:8, border:"1px solid rgba(248,113,113,0.3)",
                            background:"rgba(248,113,113,0.06)", color:"#f87171",
                            fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
                          }}>
                            {copiedPhone === entry.id ? "✓ Copié !" : "📞 Appeler"}
                          </button>
                        )}
                      </>
                    )}

                    {/* Séparateur */}
                    <div style={{ width:1, height:16, background:"var(--border)", flexShrink:0 }} />

                    {/* Input email manuel */}
                    <input
                      type="email"
                      placeholder="Email manuel…"
                      value={emailInputs[entry.id] ?? entry.prospect_email ?? ""}
                      onChange={(e) => setEmailInputs((p) => ({ ...p, [entry.id]: e.target.value }))}
                      onBlur={() => saveProspectEmail(entry)}
                      style={{
                        flex:1, minWidth:140, padding:"4px 8px", borderRadius:8,
                        border:"1px solid var(--border2)", background:"var(--surface)",
                        color:"var(--text)", fontSize:12, outline:"none", fontFamily:"inherit",
                      }}
                    />

                    {/* Bouton générer email (modal) */}
                    <button onClick={() => generateEmail(entry)} style={{
                      padding:"4px 10px", borderRadius:8, border:"1px solid",
                      borderColor: entry.email_generated ? "rgba(56,189,248,0.4)" : "rgba(245,158,11,0.35)",
                      background:  entry.email_generated ? "rgba(56,189,248,0.08)" : "rgba(245,158,11,0.08)",
                      color:       entry.email_generated ? "#38bdf8" : "#f59e0b",
                      fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
                    }}>
                      {entry.email_generated ? "✉️ Voir l'email" : "✨ Générer l'email"}
                    </button>
                  </div>

                  {/* Badges bas */}
                  {(entry.email_generated || entry.email_sent !== undefined) && (
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      {entry.email_generated && (
                        <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:"rgba(56,189,248,0.12)", color:"#38bdf8", border:"1px solid rgba(56,189,248,0.3)" }}>
                          ✓ Email prêt
                        </span>
                      )}
                      {entry.email_generated && (
                        <button onClick={() => {
                          const next = !entry.email_sent;
                          setEntries((p) => p.map((e) => e.id === entry.id ? { ...e, email_sent: next } : e));
                          patchRaw(entry.id, { email_sent: next });
                        }} style={{
                          padding:"2px 10px", borderRadius:20, border:"1px solid", fontSize:11, fontWeight:700, cursor:"pointer",
                          borderColor: entry.email_sent ? "rgba(74,222,128,0.4)" : "rgba(148,163,184,0.3)",
                          background:  entry.email_sent ? "rgba(74,222,128,0.1)" : "transparent",
                          color:       entry.email_sent ? "#4ade80"              : "var(--muted)",
                        }}>
                          {entry.email_sent ? "📨 Envoyé" : "📨 Marquer envoyé"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
