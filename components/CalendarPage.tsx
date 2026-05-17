"use client";

import { useState, useEffect } from "react";
import { CRMEntry } from "@/lib/storage";

interface DBEntry {
  id: string;
  business: CRMEntry["business"];
  status: CRMEntry["status"];
  note: string;
  rappel_at: string | null;
  rappel_direction: CRMEntry["rappelDirection"];
  site_cree: boolean;
  added_at: string;
}

interface RappelEntry {
  id: string;
  name: string;
  phone?: string;
  address: string;
  status: CRMEntry["status"];
  rappelAt: Date;
  direction: CRMEntry["rappelDirection"];
  note: string;
}

const STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  nouveau:       { label: "Nouveau",       color: "#818cf8", bg: "rgba(99,102,241,0.15)"  },
  contacte:      { label: "Contacté",      color: "#60a5fa", bg: "rgba(96,165,250,0.15)"  },
  interesse:     { label: "Intéressé",     color: "#facc15", bg: "rgba(250,204,21,0.15)"  },
  signe:         { label: "Signé ✓",       color: "#4ade80", bg: "rgba(74,222,128,0.15)"  },
  pas_interesse: { label: "Pas intéressé", color: "#f87171", bg: "rgba(248,113,113,0.15)" },
  nrp:           { label: "NRP",           color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  faux_lead:     { label: "Faux lead",     color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
  faux_num:      { label: "Faux num",      color: "#e879f9", bg: "rgba(232,121,249,0.12)" },
  ferme:         { label: "Fermé",         color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  deja_installe: { label: "Déjà installé", color: "#2dd4bf", bg: "rgba(45,212,191,0.12)"  },
};

const JOURS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const MOIS  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function sameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

export default function CalendarPage({ businessId = "gensite" }: { businessId?: string }) {
  const [rappels, setRappels]   = useState<RappelEntry[]>([]);
  const [today]                 = useState(new Date());
  const [current, setCurrent]   = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState<Date>(new Date());
  const [copiedPhone, setCopiedPhone] = useState<string|null>(null);

  useEffect(() => {
    fetch(`/api/crm?businessId=${businessId}`).then((r) => r.json()).then((data: DBEntry[]) => {
      setRappels(data.filter((e) => e.rappel_at).map((e) => ({
        id: e.id, name: e.business.name, phone: e.business.phone,
        address: e.business.address, status: e.status,
        rappelAt: new Date(e.rappel_at!), direction: e.rappel_direction, note: e.note,
      })));
    });
  }, []);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(year, month, 1 + i - firstDow);
    cells.push({ date, inMonth: date.getMonth() === month });
  }

  const byDay = (d: Date) => rappels.filter((r) => sameDay(r.rappelAt, d));
  const selectedRappels = rappels.filter((r) => sameDay(r.rappelAt, selected)).sort((a,b) => a.rappelAt.getTime()-b.rappelAt.getTime());

  const isPastDay = (d: Date) => { const c = new Date(d); c.setHours(0,0,0,0); const t = new Date(today); t.setHours(0,0,0,0); return c < t; };

  const copyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(id); setTimeout(() => setCopiedPhone(null), 1500);
  };

  const statsData = [
    { label:"En retard",   val: rappels.filter((r) => isPastDay(r.rappelAt)).length,      color:"#f87171", bg:"rgba(248,113,113,0.1)", border:"rgba(248,113,113,0.2)" },
    { label:"Aujourd'hui", val: rappels.filter((r) => sameDay(r.rappelAt, today)).length, color:"#facc15", bg:"rgba(250,204,21,0.1)",  border:"rgba(250,204,21,0.2)"  },
    { label:"À venir",     val: rappels.filter((r) => { const c=new Date(r.rappelAt);c.setHours(0,0,0,0);const t=new Date(today);t.setHours(0,0,0,0);return c>t; }).length, color:"#60a5fa", bg:"rgba(96,165,250,0.1)", border:"rgba(96,165,250,0.2)" },
    { label:"Total",       val: rappels.length,                                            color:"var(--accent-light)", bg:"var(--accent-bg)", border:"var(--accent-border)" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Stats */}
      <div style={{ display:"flex", gap:12 }}>
        {statsData.map((s) => (
          <div key={s.label} style={{ flex:1, padding:"14px 18px", borderRadius:12, background:s.bg, border:`1px solid ${s.border}`, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.val}</span>
            <span style={{ fontSize:12, color:"var(--muted)", fontWeight:500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20, alignItems:"start" }}>

        {/* Calendrier */}
        <div className="card">
          <div className="card-header">
            <button onClick={() => setCurrent(new Date(year, month-1, 1))} className="btn btn-ghost btn-sm">‹</button>
            <span style={{ fontWeight:700, fontSize:15 }}>{MOIS[month]} {year}</span>
            <button onClick={() => setCurrent(new Date(year, month+1, 1))} className="btn btn-ghost btn-sm">›</button>
            <button onClick={() => { setCurrent(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(new Date(today)); }}
              className="btn btn-ghost btn-sm" style={{ marginLeft:"auto" }}>Aujourd'hui</button>
          </div>

          <div style={{ padding:16 }}>
            {/* En-têtes */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:8 }}>
              {JOURS.map((j) => (
                <div key={j} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", padding:"4px 0" }}>{j}</div>
              ))}
            </div>

            {/* Grille */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
              {cells.map(({ date, inMonth }, i) => {
                const dayR     = byDay(date);
                const isToday  = sameDay(date, today);
                const isSel    = sameDay(date, selected);
                const past     = isPastDay(date);

                return (
                  <button key={i} onClick={() => setSelected(date)} style={{
                    padding:"6px 4px", borderRadius:10, border:"1px solid", minHeight:68,
                    cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                    borderColor: isSel ? "var(--accent)" : isToday ? "rgba(250,204,21,0.4)" : "var(--border)",
                    background:  isSel ? "var(--accent-bg)" : isToday ? "rgba(250,204,21,0.06)" : "var(--surface2)",
                    opacity: inMonth ? 1 : 0.3, transition:"all 0.1s",
                  }}>
                    <span style={{
                      fontSize:13, fontWeight: isToday ? 800 : 500,
                      color: isSel ? "var(--accent-light)" : isToday ? "#facc15" : "var(--text)",
                      width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                      background: isToday && !isSel ? "rgba(250,204,21,0.15)" : "transparent",
                    }}>{date.getDate()}</span>

                    {dayR.length > 0 && (
                      <div style={{ display:"flex", gap:3, flexWrap:"wrap", justifyContent:"center" }}>
                        {dayR.slice(0,4).map((_, ri) => (
                          <span key={ri} style={{ width:6, height:6, borderRadius:"50%", background: past ? "#f87171" : isToday ? "#facc15" : "#60a5fa" }} />
                        ))}
                        {dayR.length > 4 && <span style={{ fontSize:9, color:"var(--muted)", fontWeight:700 }}>+{dayR.length-4}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Détail du jour */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ fontWeight:700, fontSize:14, color:"var(--text)", padding:"0 4px" }}>
            {sameDay(selected, today) ? "Aujourd'hui" : `${JOURS[(selected.getDay()+6)%7]} ${selected.getDate()} ${MOIS[selected.getMonth()]}`}
            <span style={{ fontSize:12, color:"var(--muted)", fontWeight:400, marginLeft:8 }}>
              {selectedRappels.length} rappel{selectedRappels.length!==1?"s":""}
            </span>
          </div>

          {selectedRappels.length === 0 ? (
            <div className="card empty" style={{ padding:"32px 20px" }}>
              <div style={{ fontSize:32, opacity:0.3 }}>📅</div>
              <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center" }}>Aucun rappel ce jour</div>
            </div>
          ) : selectedRappels.map((r) => {
            const st = STATUSES[r.status] || STATUSES.nouveau;
            const hh = String(r.rappelAt.getHours()).padStart(2,"0");
            const mm = String(r.rappelAt.getMinutes()).padStart(2,"0");
            const past = isPastDay(r.rappelAt);

            return (
              <div key={r.id} className="card" style={{ borderLeft:`3px solid ${past ? "#f87171" : "#60a5fa"}`, overflow:"hidden" }}>
                <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:22, fontWeight:800, color: past ? "#f87171" : "#60a5fa" }}>{hh}h{mm}</span>
                    <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:st.bg, color:st.color, fontWeight:700 }}>{st.label}</span>
                  </div>

                  <div style={{ fontWeight:700, fontSize:14 }}>{r.name}</div>
                  {r.address && <div style={{ fontSize:12, color:"var(--muted)" }}>📍 {r.address}</div>}

                  {r.phone && (
                    <button onClick={() => copyPhone(r.phone!, r.id)} style={{
                      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      background:"var(--surface2)", border:"1px solid var(--border2)",
                      borderRadius:8, padding:"8px 12px", cursor:"pointer",
                      color: copiedPhone===r.id ? "var(--green)" : "var(--text)",
                      fontSize:13, fontWeight:600, width:"100%",
                    }}>
                      📞 {copiedPhone===r.id ? "Copié !" : r.phone}
                    </button>
                  )}

                  {r.direction && (
                    <div style={{ fontSize:11, color:"var(--muted)", textAlign:"center" }}>
                      {r.direction==="je_rappelle" ? "📞 Tu dois rappeler" : "📲 Ils te rappellent"}
                    </div>
                  )}

                  {r.note && (
                    <div style={{ fontSize:12, color:"var(--muted)", padding:"8px 10px", background:"var(--surface2)", borderRadius:8, lineHeight:1.5, borderLeft:"2px solid var(--border2)" }}>
                      {r.note}
                    </div>
                  )}

                  <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name+" "+r.address)}`, "_blank")}
                    className="btn btn-ghost btn-sm" style={{ justifyContent:"center" }}>
                    📍 Voir sur Maps
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
