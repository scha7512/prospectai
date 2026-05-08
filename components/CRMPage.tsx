"use client";

import { useState, useEffect } from "react";
import { CRMEntry } from "@/lib/storage";

// Les données viennent maintenant de l'API (Supabase)

const STATUSES: { value: CRMEntry["status"]; label: string; color: string; bg: string; border: string }[] = [
  { value: "nouveau",       label: "Nouveau",       color: "#818cf8", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)" },
  { value: "contacte",      label: "Contacté",      color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)" },
  { value: "interesse",     label: "Intéressé",     color: "#facc15", bg: "rgba(250,204,21,0.12)",  border: "rgba(250,204,21,0.3)" },
  { value: "signe",         label: "Signé ✓",       color: "#4ade80", bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)" },
  { value: "pas_interesse", label: "Pas intéressé", color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
];

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function formatRappel(iso: string): { ligne1: string; ligne2: string; isPast: boolean; isToday: boolean } {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isPast = dDay < today;
  const isToday = dDay.getTime() === today.getTime();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return {
    ligne1: `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`,
    ligne2: `${hh}h${mm}`,
    isPast,
    isToday,
  };
}

type EntryWithId = CRMEntry & { id: string };

// Données Supabase — format snake_case → camelCase
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

export default function CRMPage() {
  const [entries, setEntries] = useState<EntryWithId[]>([]);
  const [filterStatus, setFilterStatus] = useState<CRMEntry["status"] | "all" | "a_rappeler" | "ils_rappellent">("all");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [editingRappel, setEditingRappel] = useState<string | null>(null);
  const [rappelValue, setRappelValue] = useState("");

  const reload = async () => {
    const res = await fetch("/api/crm");
    if (!res.ok) return;
    const data: DBEntry[] = await res.json();
    setEntries(data.map((e) => ({
      id: e.id,
      business: e.business,
      status: e.status,
      note: e.note,
      rappelAt: e.rappel_at,
      rappelDirection: e.rappel_direction,
      siteCree: e.site_cree,
      addedAt: e.added_at,
      updatedAt: e.added_at,
    })));
  };

  useEffect(() => { reload(); }, []);

  const allEntries: EntryWithId[] = entries;

  const filtered: EntryWithId[] = (
    filterStatus === "all" ? allEntries
    : filterStatus === "a_rappeler" ? allEntries.filter((e) => e.rappelAt && e.rappelDirection === "je_rappelle")
    : filterStatus === "ils_rappellent" ? allEntries.filter((e) => e.rappelDirection === "ils_rappellent")
    : allEntries.filter((e) => e.status === filterStatus)
  )
    .sort((a, b) => {
      // Rappels définis d'abord, du plus proche au plus loin
      if (a.rappelAt && b.rappelAt) return new Date(a.rappelAt).getTime() - new Date(b.rappelAt).getTime();
      if (a.rappelAt) return -1;
      if (b.rappelAt) return 1;
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });

  const update = async (id: string, patch: Partial<Pick<CRMEntry, "status" | "note" | "rappelAt" | "rappelDirection" | "siteCree">>) => {
    // Convertir camelCase → snake_case pour Supabase
    const dbPatch: Record<string, unknown> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.note !== undefined) dbPatch.note = patch.note;
    if (patch.rappelAt !== undefined) dbPatch.rappel_at = patch.rappelAt;
    if (patch.rappelDirection !== undefined) dbPatch.rappel_direction = patch.rappelDirection;
    if (patch.siteCree !== undefined) dbPatch.site_cree = patch.siteCree;

    // Optimistic update
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...patch } : e));

    await fetch(`/api/crm/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dbPatch),
    });
  };

  const saveNote = (id: string) => {
    update(id, { note: noteValue });
    setEditingNote(null);
  };

  const saveRappel = (id: string) => {
    update(id, { rappelAt: rappelValue ? new Date(rappelValue).toISOString() : null });
    setEditingRappel(null);
  };

  const removeEntry = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/crm/${id}`, { method: "DELETE" });
  };

  const openMaps = (name: string, address: string) =>
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + address)}`, "_blank");

  const stats = STATUSES.map((s) => ({ ...s, count: allEntries.filter((e) => e.status === s.value).length }));

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#e8e8f0" }}>CRM Prospects</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
          {allEntries.length} lead{allEntries.length !== 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={() => setFilterStatus("all")} style={{
          padding: "7px 14px", borderRadius: 10, border: "1px solid",
          borderColor: filterStatus === "all" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
          background: filterStatus === "all" ? "rgba(255,255,255,0.08)" : "transparent",
          color: "#e8e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>Tous ({allEntries.length})</button>

        {/* Filtres rappel */}
        {[
          { key: "a_rappeler", label: "📞 À rappeler", color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.3)", count: allEntries.filter((e) => e.rappelAt && e.rappelDirection === "je_rappelle").length },
          { key: "ils_rappellent", label: "📲 Ils me rappellent", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", count: allEntries.filter((e) => e.rappelDirection === "ils_rappellent").length },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilterStatus(f.key as "a_rappeler" | "ils_rappellent")} style={{
            padding: "7px 14px", borderRadius: 10, border: "1px solid",
            borderColor: filterStatus === f.key ? f.border : "rgba(255,255,255,0.07)",
            background: filterStatus === f.key ? f.bg : "transparent",
            color: filterStatus === f.key ? f.color : "rgba(255,255,255,0.4)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{f.label} ({f.count})</button>
        ))}

        <div style={{ width: 1, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />

        {stats.map((s) => (
          <button key={s.value} onClick={() => setFilterStatus(s.value)} style={{
            padding: "7px 14px", borderRadius: 10, border: "1px solid",
            borderColor: filterStatus === s.value ? s.border : "rgba(255,255,255,0.07)",
            background: filterStatus === s.value ? s.bg : "transparent",
            color: filterStatus === s.value ? s.color : "rgba(255,255,255,0.4)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{s.label} ({s.count})</button>
        ))}
      </div>

      {/* Vide */}
      {filtered.length === 0 && (
        <div style={{ padding: 60, textAlign: "center", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "#16161e" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
            {allEntries.length === 0 ? "Aucun lead dans le CRM. Ajoutez-en depuis la recherche." : "Aucun lead avec ce statut."}
          </p>
        </div>
      )}

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((entry) => {
          const st = STATUSES.find((s) => s.value === entry.status) || STATUSES[0];
          const b = entry.business;
          const rappel = entry.rappelAt ? formatRappel(entry.rappelAt) : null;

          // Couleur de la bordure gauche selon rappel
          let leftColor = "rgba(255,255,255,0.08)";
          if (rappel?.isPast) leftColor = "#f87171";
          else if (rappel?.isToday) leftColor = "#facc15";
          else if (rappel) leftColor = "#60a5fa";

          return (
            <div key={entry.id} style={{
              background: "#16161e",
              border: "1px solid rgba(255,255,255,0.07)",
              borderLeft: `4px solid ${leftColor}`,
              borderRadius: 14,
              padding: 20,
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 16,
            }}>
              {/* Colonne gauche */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Ligne 1 : Nom + statut */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#e8e8f0" }}>{b.name}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(99,102,241,0.12)", color: "#818cf8", fontSize: 11, fontWeight: 500 }}>
                    {b.types[0]}
                  </span>
                  <select
                    value={entry.status}
                    onChange={(e) => update(entry.id, { status: e.target.value as CRMEntry["status"] })}
                    style={{
                      padding: "4px 8px", borderRadius: 8, border: `1px solid ${st.border}`,
                      background: st.bg, color: st.color, fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none",
                    }}
                  >
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                {/* Ligne 2 : Adresse + téléphone */}
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {b.address && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>📍 {b.address}</span>}
                  {b.phone && (
                    <button onClick={() => navigator.clipboard.writeText(b.phone!)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500, padding: 0 }}>
                      📞 {b.phone}
                    </button>
                  )}
                </div>

                {/* RDV / Rappel */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>📅 RAPPEL</span>
                  {editingRappel === entry.id ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        type="datetime-local"
                        value={rappelValue}
                        onChange={(e) => setRappelValue(e.target.value)}
                        style={{
                          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(99,102,241,0.4)",
                          borderRadius: 8, color: "#e8e8f0", fontSize: 13, padding: "5px 10px", outline: "none",
                        }}
                      />
                      <button onClick={() => saveRappel(entry.id)} style={{ background: "#6366f1", border: "none", borderRadius: 8, color: "white", cursor: "pointer", padding: "5px 12px", fontSize: 13, fontWeight: 600 }}>✓</button>
                      <button onClick={() => { update(entry.id, { rappelAt: null }); setEditingRappel(null); }}
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", cursor: "pointer", padding: "5px 10px", fontSize: 12 }}>
                        Supprimer
                      </button>
                    </div>
                  ) : rappel ? (
                    <button onClick={() => { setEditingRappel(entry.id); setRappelValue(entry.rappelAt ? entry.rappelAt.slice(0, 16) : ""); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: rappel.isPast ? "rgba(248,113,113,0.1)" : rappel.isToday ? "rgba(250,204,21,0.1)" : "rgba(96,165,250,0.1)",
                        border: `1px solid ${rappel.isPast ? "rgba(248,113,113,0.3)" : rappel.isToday ? "rgba(250,204,21,0.3)" : "rgba(96,165,250,0.3)"}`,
                        borderRadius: 10, padding: "6px 12px", cursor: "pointer",
                      }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: rappel.isPast ? "#f87171" : rappel.isToday ? "#facc15" : "#60a5fa" }}>
                          {rappel.ligne1}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: rappel.isPast ? "#f87171" : rappel.isToday ? "#facc15" : "#60a5fa" }}>
                          {rappel.ligne2}
                        </div>
                      </div>
                      {rappel.isPast && <span style={{ fontSize: 11, color: "#f87171", fontWeight: 600 }}>En retard</span>}
                      {rappel.isToday && <span style={{ fontSize: 11, color: "#facc15", fontWeight: 600 }}>Aujourd'hui</span>}
                    </button>
                  ) : (
                    <button onClick={() => { setEditingRappel(entry.id); setRappelValue(""); }}
                      style={{
                        padding: "5px 12px", borderRadius: 8, border: "1px dashed rgba(255,255,255,0.15)",
                        background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer",
                      }}>
                      + Fixer une date
                    </button>
                  )}
                </div>

                {/* Direction rappel */}
                <div style={{ display: "flex", gap: 8 }}>
                  {([
                    { value: "je_rappelle",    label: "📞 Je rappelle",       color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)" },
                    { value: "ils_rappellent", label: "📲 Ils me rappellent", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" },
                  ] as const).map((opt) => {
                    const active = entry.rappelDirection === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => update(entry.id, { rappelDirection: active ? null : opt.value })}
                        style={{
                          padding: "5px 12px", borderRadius: 9, border: "1px solid",
                          borderColor: active ? opt.border : "rgba(255,255,255,0.08)",
                          background: active ? opt.bg : "transparent",
                          color: active ? opt.color : "rgba(255,255,255,0.3)",
                          fontSize: 12, fontWeight: active ? 700 : 400, cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Note */}
                <div>
                  {editingNote === entry.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <textarea
                        autoFocus
                        value={noteValue}
                        onChange={(e) => setNoteValue(e.target.value)}
                        rows={3}
                        placeholder="Votre note…"
                        style={{
                          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.4)",
                          borderRadius: 8, color: "#e8e8f0", fontSize: 13, padding: "8px 12px",
                          outline: "none", resize: "vertical", fontFamily: "inherit", width: "100%",
                        }}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => saveNote(entry.id)} style={{ background: "#6366f1", border: "none", borderRadius: 8, color: "white", cursor: "pointer", padding: "6px 16px", fontSize: 13, fontWeight: 600 }}>Sauvegarder</button>
                        <button onClick={() => setEditingNote(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "6px 12px", fontSize: 13 }}>Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingNote(entry.id); setNoteValue(entry.note || ""); }}
                      style={{
                        width: "100%", textAlign: "left", background: entry.note ? "rgba(255,255,255,0.03)" : "transparent",
                        border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 8,
                        color: entry.note ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
                        fontSize: 13, padding: "8px 12px", cursor: "pointer", fontFamily: "inherit", lineHeight: 1.5,
                      }}>
                      {entry.note || "✏️ Ajouter une note…"}
                    </button>
                  )}
                </div>
              </div>

              {/* Colonne droite : Site créé + actions */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, minWidth: 120 }}>

                {/* SITE CRÉÉ — très visible */}
                <button
                  onClick={() => update(entry.id, { siteCree: !entry.siteCree })}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "14px 20px", borderRadius: 14, border: "2px solid",
                    borderColor: entry.siteCree ? "#4ade80" : "rgba(255,255,255,0.12)",
                    background: entry.siteCree ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.03)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 32 }}>{entry.siteCree ? "✅" : "🌐"}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em",
                    color: entry.siteCree ? "#4ade80" : "rgba(255,255,255,0.3)",
                  }}>
                    {entry.siteCree ? "Site créé" : "Pas de site"}
                  </span>
                </button>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openMaps(b.name, b.address)} style={{
                    padding: "6px 10px", borderRadius: 8,
                    background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                    color: "#818cf8", fontSize: 13, cursor: "pointer",
                  }}>📍</button>
                  <button onClick={() => removeEntry(entry.id)} style={{
                    padding: "6px 10px", borderRadius: 8,
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171", fontSize: 13, cursor: "pointer",
                  }}>🗑️</button>
                </div>

                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                  {new Date(entry.addedAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
