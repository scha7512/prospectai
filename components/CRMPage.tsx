"use client";

import { useState, useEffect } from "react";
import { getCRM, updateCRMEntry, deleteCRMEntry, CRMEntry } from "@/lib/storage";

const STATUSES: { value: CRMEntry["status"]; label: string; color: string; bg: string; border: string }[] = [
  { value: "nouveau",       label: "Nouveau",       color: "#818cf8", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)" },
  { value: "contacte",      label: "Contacté",      color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)" },
  { value: "interesse",     label: "Intéressé",     color: "#facc15", bg: "rgba(250,204,21,0.12)",  border: "rgba(250,204,21,0.3)" },
  { value: "signe",         label: "Signé ✓",       color: "#4ade80", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.3)" },
  { value: "pas_interesse", label: "Pas intéressé", color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
];

const COLUMNS: CRMEntry["status"][] = ["nouveau", "contacte", "interesse", "signe", "pas_interesse"];

export default function CRMPage() {
  const [crm, setCrm] = useState<Record<string, CRMEntry>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [filterStatus, setFilterStatus] = useState<CRMEntry["status"] | "all">("all");

  const reload = () => setCrm(getCRM());

  useEffect(() => { reload(); }, []);

  const entries = Object.entries(crm).map(([id, e]) => ({ id, ...e }));
  const filtered = filterStatus === "all" ? entries : entries.filter((e) => e.status === filterStatus);

  const changeStatus = (id: string, status: CRMEntry["status"]) => {
    updateCRMEntry(id, { status });
    reload();
  };

  const saveNote = (id: string) => {
    updateCRMEntry(id, { note: noteValue });
    setEditingNote(null);
    reload();
  };

  const remove = (id: string) => {
    deleteCRMEntry(id);
    reload();
  };

  const openMaps = (name: string, address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + address)}`, "_blank");
  };

  // Stats
  const stats = STATUSES.map((s) => ({
    ...s,
    count: entries.filter((e) => e.status === s.value).length,
  }));

  return (
    <div style={{ padding: 24, maxWidth: 1500, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#e8e8f0" }}>CRM Prospects</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            {entries.length} lead{entries.length !== 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Stats par statut */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <button
          onClick={() => setFilterStatus("all")}
          style={{
            padding: "8px 16px", borderRadius: 10, border: "1px solid",
            borderColor: filterStatus === "all" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
            background: filterStatus === "all" ? "rgba(255,255,255,0.08)" : "transparent",
            color: "#e8e8f0", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Tous ({entries.length})
        </button>
        {stats.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            style={{
              padding: "8px 16px", borderRadius: 10, border: "1px solid",
              borderColor: filterStatus === s.value ? s.border : "rgba(255,255,255,0.07)",
              background: filterStatus === s.value ? s.bg : "transparent",
              color: filterStatus === s.value ? s.color : "rgba(255,255,255,0.4)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {s.label} ({s.count})
          </button>
        ))}
      </div>

      {/* Tableau */}
      {filtered.length === 0 ? (
        <div style={{
          padding: 60, textAlign: "center", borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.07)", background: "#16161e",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
            {entries.length === 0
              ? "Aucun lead dans le CRM. Ajoutez-en depuis la recherche."
              : "Aucun lead avec ce statut."}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Statut", "Nom", "Secteur", "Adresse", "Téléphone", "Note", "Ajouté le", "Actions"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left", fontWeight: 600,
                    fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
                    letterSpacing: "0.06em", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => {
                const st = STATUSES.find((s) => s.value === entry.status) || STATUSES[0];
                const b = entry.business;
                return (
                  <tr key={entry.id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)")}
                  >
                    {/* Statut */}
                    <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                      <select
                        value={entry.status}
                        onChange={(e) => changeStatus(entry.id, e.target.value as CRMEntry["status"])}
                        style={{
                          padding: "4px 8px", borderRadius: 8, border: `1px solid ${st.border}`,
                          background: st.bg, color: st.color, fontSize: 12, fontWeight: 600,
                          cursor: "pointer", outline: "none",
                        }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Nom */}
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#e8e8f0", whiteSpace: "nowrap" }}>
                      {b.name}
                    </td>

                    {/* Secteur */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(99,102,241,0.12)", color: "#818cf8", fontSize: 11, fontWeight: 500 }}>
                        {b.types[0]}
                      </span>
                    </td>

                    {/* Adresse */}
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", maxWidth: 200 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.address || "—"}
                      </span>
                    </td>

                    {/* Téléphone */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                      {b.phone || "—"}
                    </td>

                    {/* Note */}
                    <td style={{ padding: "10px 16px", maxWidth: 200 }}>
                      {editingNote === entry.id ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <input
                            autoFocus
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") saveNote(entry.id); if (e.key === "Escape") setEditingNote(null); }}
                            style={{
                              flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(99,102,241,0.4)",
                              borderRadius: 6, color: "#e8e8f0", fontSize: 12, padding: "4px 8px", outline: "none",
                            }}
                          />
                          <button onClick={() => saveNote(entry.id)} style={{ background: "#6366f1", border: "none", borderRadius: 6, color: "white", cursor: "pointer", padding: "4px 8px", fontSize: 12 }}>✓</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingNote(entry.id); setNoteValue(entry.note || ""); }}
                          style={{
                            background: "none", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6,
                            color: entry.note ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
                            fontSize: 12, cursor: "pointer", padding: "3px 8px", maxWidth: 180,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            display: "block",
                          }}
                        >
                          {entry.note || "✏️ Ajouter une note"}
                        </button>
                      )}
                    </td>

                    {/* Date */}
                    <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.25)", fontSize: 11, whiteSpace: "nowrap" }}>
                      {new Date(entry.addedAt).toLocaleDateString("fr-FR")}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => openMaps(b.name, b.address)}
                          style={{
                            padding: "5px 10px", borderRadius: 8,
                            background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                            color: "#818cf8", fontSize: 11, fontWeight: 600, cursor: "pointer",
                          }}
                        >📍</button>
                        <button
                          onClick={() => remove(entry.id)}
                          style={{
                            padding: "5px 10px", borderRadius: 8,
                            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                            color: "#f87171", fontSize: 11, cursor: "pointer",
                          }}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
