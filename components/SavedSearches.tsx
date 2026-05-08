"use client";

import { useState, useEffect } from "react";
import { getSavedSearches, deleteSearch, SavedSearch } from "@/lib/storage";
import { SECTORS } from "@/lib/constants";

interface Props {
  onLoad: (search: SavedSearch) => void;
}

export default function SavedSearches({ onLoad }: Props) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSearches(getSavedSearches());
  }, [open]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSearch(id);
    setSearches(getSavedSearches());
  };

  const sectorIcon = (type: string) => SECTORS.find((s) => s.type === type)?.icon || "📍";

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "0 16px", height: 48, borderRadius: 12,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          color: open ? "#818cf8" : "rgba(255,255,255,0.6)",
          fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          whiteSpace: "nowrap",
        }}
      >
        🕐 Mes recherches {searches.length > 0 && (
          <span style={{ background: "#6366f1", color: "white", borderRadius: 10, padding: "1px 6px", fontSize: 11 }}>
            {searches.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100,
          background: "#1e1e2a", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, padding: 8, minWidth: 300,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {searches.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "20px 0", margin: 0 }}>
              Aucune recherche sauvegardée
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 360, overflowY: "auto" }}>
              {searches.map((s) => (
                <div
                  key={s.id}
                  onClick={() => { onLoad(s); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.02)", cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                >
                  <div style={{ fontSize: 18 }}>{sectorIcon(s.sectors[0])}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                      {s.results.length} résultats · {new Date(s.date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(s.id, e)}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 16, padding: "0 4px", lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
