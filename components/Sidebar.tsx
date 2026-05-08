"use client";

import { useState } from "react";
import { SECTORS, DISTANCES } from "@/lib/constants";

interface SidebarProps {
  selectedSectors: string[];
  onSectorToggle: (type: string) => void;
  distance: string;
  onDistanceChange: (d: string) => void;
  websiteFilter: string;
  onWebsiteFilterChange: (f: string) => void;
  maxLeads: number;
  onMaxLeadsChange: (n: number) => void;
  stats: { total: number; noWebsite: number; withWebsite: number } | null;
  view: "search" | "crm" | "equipe";
  onViewChange: (v: "search" | "crm" | "equipe") => void;
  crmCount: number;
}

interface SidebarPropsExtra {
  onSelectAllSectors: () => void;
  onClearSectors: () => void;
  isAdmin?: boolean;
}

export default function Sidebar({
  selectedSectors,
  onSectorToggle,
  distance,
  onDistanceChange,
  websiteFilter,
  onWebsiteFilterChange,
  maxLeads,
  onMaxLeadsChange,
  stats,
  view,
  onViewChange,
  crmCount,
  onSelectAllSectors,
  onClearSectors,
  isAdmin,
}: SidebarProps & SidebarPropsExtra) {
  const [sectorSearch, setSectorSearch] = useState("");
  const allSelected = selectedSectors.length === SECTORS.length;
  const filteredSectors = SECTORS.filter((s) =>
    s.label.toLowerCase().includes(sectorSearch.toLowerCase())
  );

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        position: "sticky",
        top: 24,
        maxHeight: "calc(100vh - 48px)",
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #6366f1, #a855f7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>🔍</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#e8e8f0" }}>ProspectAI</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Prospection locale</div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {([
          { v: "search" as const, icon: "🔍", label: "Recherche",     count: undefined as number | undefined, adminOnly: false },
          { v: "crm" as const,    icon: "📋", label: "Mon CRM",       count: crmCount,                        adminOnly: false },
          { v: "equipe" as const, icon: "👥", label: "Mon équipe",    count: undefined,                       adminOnly: true  },
        ] as const).filter((item) => !item.adminOnly || isAdmin).map(({ v, icon, label, count }) => (
          <button key={v} onClick={() => onViewChange(v)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 12, border: "1px solid",
            borderColor: view === v ? "#6366f1" : "rgba(255,255,255,0.07)",
            background: view === v ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.02)",
            color: view === v ? "#818cf8" : "rgba(255,255,255,0.5)",
            fontSize: 14, fontWeight: view === v ? 600 : 400, cursor: "pointer",
          }}>
            <span>{icon}</span>
            <span style={{ flex: 1 }}>{label}</span>
            {count !== undefined && count > 0 && (
              <span style={{ background: "#6366f1", color: "white", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div className="card" style={{ padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#6366f1" }}>{stats.noWebsite}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Sans site</div>
          </div>
          <div className="card" style={{ padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#e8e8f0" }}>{stats.total}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Total</div>
          </div>
        </div>
      )}

      {/* Nombre de leads */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Nombre de leads
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="number"
            min={1}
            max={100}
            value={maxLeads}
            onChange={(e) => onMaxLeadsChange(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            style={{
              width: 80, padding: "8px 12px", borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#e8e8f0", fontSize: 20, fontWeight: 700, textAlign: "center", outline: "none",
            }}
          />
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
            entreprises<br />à trouver
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {[5, 10, 25, 50].map((n) => (
            <button key={n} onClick={() => onMaxLeadsChange(n)}
              style={{
                flex: 1, padding: "5px 0", borderRadius: 8, border: "1px solid",
                borderColor: maxLeads === n ? "#6366f1" : "rgba(255,255,255,0.07)",
                background: maxLeads === n ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.02)",
                color: maxLeads === n ? "#818cf8" : "rgba(255,255,255,0.4)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Filtre site web */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Présence web
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { value: "no_website", label: "Sans site web", icon: "🚫", desc: "Prospects à contacter" },
            { value: "with_website", label: "Avec site web", icon: "✅", desc: "Déjà en ligne" },
            { value: "all", label: "Tous", icon: "📋", desc: "Voir tout" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onWebsiteFilterChange(opt.value)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, border: "1px solid",
                borderColor: websiteFilter === opt.value ? "#6366f1" : "rgba(255,255,255,0.07)",
                background: websiteFilter === opt.value ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 16 }}>{opt.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: websiteFilter === opt.value ? "#818cf8" : "#e8e8f0" }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zone de recherche */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Zone
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {DISTANCES.map((d) => (
            <button
              key={d.value}
              onClick={() => onDistanceChange(d.value)}
              style={{
                flex: 1, padding: "8px 4px", borderRadius: 10, border: "1px solid",
                borderColor: distance === d.value ? "#6366f1" : "rgba(255,255,255,0.07)",
                background: distance === d.value ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: distance === d.value ? "#818cf8" : "#e8e8f0" }}>
                {d.label}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{d.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Secteurs */}
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Secteurs
          </div>
          {selectedSectors.length > 0 && (
            <span style={{ fontSize: 11, background: "#6366f1", color: "white", borderRadius: 10, padding: "1px 7px", fontWeight: 600 }}>
              {selectedSectors.length}
            </span>
          )}
        </div>

        {/* Barre de recherche */}
        <input
          type="text"
          placeholder="🔎 Rechercher un secteur…"
          value={sectorSearch}
          onChange={(e) => setSectorSearch(e.target.value)}
          style={{
            width: "100%", padding: "7px 10px", borderRadius: 9, marginBottom: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#e8e8f0", fontSize: 12, outline: "none",
          }}
        />

        {/* Tout cocher / Tout décocher */}
        <button
          onClick={allSelected ? onClearSectors : onSelectAllSectors}
          style={{
            width: "100%", padding: "7px 12px", borderRadius: 10, marginBottom: 8,
            border: "1px solid",
            borderColor: allSelected ? "#6366f1" : "rgba(255,255,255,0.1)",
            background: allSelected ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
            color: allSelected ? "#818cf8" : "rgba(255,255,255,0.5)",
            fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "left",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <span style={{
            width: 16, height: 16, borderRadius: 4, border: "2px solid",
            borderColor: allSelected ? "#6366f1" : "rgba(255,255,255,0.2)",
            background: allSelected ? "#6366f1" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10,
          }}>
            {allSelected ? "✓" : ""}
          </span>
          Tous les secteurs ({SECTORS.length})
        </button>

        {/* Liste filtrée */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto" }}>
          {filteredSectors.length === 0 && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "10px 0", margin: 0 }}>
              Aucun secteur trouvé
            </p>
          )}
          {filteredSectors.map((sector) => {
            const active = selectedSectors.includes(sector.type);
            return (
              <button
                key={sector.type}
                onClick={() => onSectorToggle(sector.type)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 10, border: "1px solid",
                  borderColor: active ? "#6366f1" : "rgba(255,255,255,0.06)",
                  background: active ? "rgba(99,102,241,0.12)" : "transparent",
                  cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 15 }}>{sector.icon}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#818cf8" : "rgba(255,255,255,0.6)" }}>
                  {sector.label}
                </span>
                {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
