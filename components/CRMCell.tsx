"use client";

import { useState, useEffect, useRef } from "react";
import { CRMEntry, getCRM, setCRMEntry } from "@/lib/storage";

const STATUSES: { value: CRMEntry["status"]; label: string; color: string; bg: string }[] = [
  { value: "nouveau",        label: "Nouveau",        color: "#818cf8", bg: "rgba(99,102,241,0.12)" },
  { value: "contacte",       label: "Contacté",       color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  { value: "interesse",      label: "Intéressé",      color: "#facc15", bg: "rgba(250,204,21,0.12)" },
  { value: "signe",          label: "Signé ✓",        color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  { value: "pas_interesse",  label: "Pas intéressé",  color: "#f87171", bg: "rgba(248,113,113,0.12)" },
];

export default function CRMCell({ placeId }: { placeId: string }) {
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState<CRMEntry>({ status: "nouveau", note: "", updatedAt: "" });
  const [note, setNote] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const crm = getCRM();
    if (crm[placeId]) {
      setEntry(crm[placeId]);
      setNote(crm[placeId].note);
    }
  }, [placeId]);

  // Fermer si clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const updateStatus = (status: CRMEntry["status"]) => {
    const updated: CRMEntry = { status, note, updatedAt: new Date().toISOString() };
    setCRMEntry(placeId, updated);
    setEntry(updated);
  };

  const saveNote = () => {
    const updated: CRMEntry = { ...entry, note, updatedAt: new Date().toISOString() };
    setCRMEntry(placeId, updated);
    setEntry(updated);
  };

  const current = STATUSES.find((s) => s.value === entry.status) || STATUSES[0];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "3px 10px", borderRadius: 8, border: "1px solid",
          borderColor: current.color + "44",
          background: current.bg,
          color: current.color,
          fontSize: 11, fontWeight: 600, cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {current.label} ▾
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
          background: "#1e1e2a", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: 12, minWidth: 200,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {/* Statuts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => updateStatus(s.value)}
                style={{
                  padding: "6px 10px", borderRadius: 8, border: "1px solid",
                  borderColor: entry.status === s.value ? s.color + "55" : "transparent",
                  background: entry.status === s.value ? s.bg : "transparent",
                  color: entry.status === s.value ? s.color : "rgba(255,255,255,0.5)",
                  fontSize: 12, fontWeight: entry.status === s.value ? 600 : 400,
                  cursor: "pointer", textAlign: "left",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Note */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 10 }}>
            <textarea
              placeholder="Ajouter une note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={saveNote}
              rows={2}
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                color: "#e8e8f0", fontSize: 12, padding: "6px 8px",
                resize: "none", outline: "none", fontFamily: "inherit",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
