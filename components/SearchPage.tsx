"use client";

import { useState, useCallback } from "react";
import { Business } from "@/app/api/search/route";
import { DISTANCES } from "@/lib/constants";
import { getBusinessConfig } from "@/lib/businesses";
import CityInput from "./CityInput";
import { BusinessTable } from "./BusinessCard";
import SavedSearches from "./SavedSearches";
import { saveSearch, SavedSearch } from "@/lib/storage";

interface Props { onResultsChange: (leads: Business[]) => void; businessId?: string; }

export default function SearchPage({ onResultsChange, businessId = "gensite" }: Props) {
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sectors, setSectors] = useState<string[]>(["restaurant"]);
  const [distance, setDistance] = useState("ville");
  const [websiteFilter, setWebsiteFilter] = useState("no_website");
  const [maxLeads, setMaxLeads] = useState(10);
  const [sectorSearch, setSectorSearch] = useState("");
  const [results, setResults] = useState<Business[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{ total: number; noWebsite: number; withWebsite: number } | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  const SECTORS = getBusinessConfig(businessId).sectors;
  const allSelected = sectors.length === SECTORS.length;
  const filteredSectors = SECTORS.filter((s) => s.label.toLowerCase().includes(sectorSearch.toLowerCase()));

  const toggleSector = (type: string) => {
    setSectors((p) => p.includes(type) ? p.filter((s) => s !== type) : [...p, type]);
  };

  const doSearch = useCallback(async (loc: { lat: number; lng: number }) => {
    if (!sectors.length) { setError("Sélectionnez au moins un secteur."); return; }
    setSearching(true); setError("");
    const perSector = Math.ceil(maxLeads / sectors.length);
    try {
      const all = await Promise.all(sectors.map((type) =>
        fetch(`/api/search?${new URLSearchParams({ location: `${loc.lat},${loc.lng}`, distance, type, websiteFilter, maxLeads: String(perSector) })}`).then((r) => r.json())
      ));
      const seen = new Set<string>();
      const merged: Business[] = [];
      let total = 0, noWeb = 0, withWeb = 0;
      for (const d of all) {
        total += d.total_found || 0; noWeb += d.no_website_count || 0; withWeb += d.with_website_count || 0;
        for (const b of d.results || []) { if (!seen.has(b.place_id)) { seen.add(b.place_id); merged.push(b); } }
      }
      const sorted = [
        ...merged.filter((b) => b.isOpen === true),
        ...merged.filter((b) => b.isOpen === null),
        ...merged.filter((b) => b.isOpen === false),
      ].slice(0, maxLeads);
      const providers = all.map((d) => d.provider).filter(Boolean);
      setProvider(providers[0] || "osm");
      setResults(sorted);
      setStats({ total, noWebsite: noWeb, withWebsite: withWeb });
      onResultsChange(sorted);
      const sectorLabels = sectors.map((s) => SECTORS.find((x) => x.type === s)?.label || s);
      saveSearch({ label: `${city} — ${sectorLabels.join(", ")}`, city, sectors, date: new Date().toISOString(), results: sorted });
    } catch { setError("Erreur de recherche."); }
    finally { setSearching(false); }
  }, [sectors, distance, websiteFilter, maxLeads, city, onResultsChange]);

  const handleSearch = async () => {
    if (!city.trim()) return;
    let loc = location;
    if (!loc) {
      setSearching(true);
      const r = await fetch(`/api/geocode?address=${encodeURIComponent(city)}`);
      if (!r.ok) { setError((await r.json()).error || "Ville introuvable"); setSearching(false); return; }
      const g = await r.json();
      loc = { lat: g.lat, lng: g.lng };
      setLocation(loc);
    }
    await doSearch(loc);
  };

  const addToCRM = async (b: Business) => {
    await fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business: b, businessId }) });
    setAddedIds((p) => new Set([...p, b.place_id]));
  };

  const addAllToCRM = async () => {
    await Promise.all(results.map((b) => fetch("/api/crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business: b, businessId }) })));
    setAddedIds((p) => new Set([...p, ...results.map((b) => b.place_id)]));
  };

  const loadSaved = (s: SavedSearch) => {
    setCity(s.city); setSectors(s.sectors); setResults(s.results);
    setStats({ total: s.results.length, noWebsite: s.results.filter((b) => !b.hasWebsite).length, withWebsite: s.results.filter((b) => b.hasWebsite).length });
    onResultsChange(s.results);
    setLocation(null);
  };

  const exportCSV = () => {
    if (!results.length) return;
    const csv = [["Nom","Secteur","Adresse","Téléphone","Site web"], ...results.map((b) => [`"${b.name}"`,`"${b.types[0]}"`,`"${b.address}"`,`"${b.phone||""}"`,`"${b.website||""}"`])].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿"+csv], { type: "text/csv" })); a.download = `prospectai-${city}.csv`; a.click();
  };

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      {/* Sidebar filtres */}
      <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 80 }}>

        {/* Nombre de leads */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Nombre de leads</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <input type="number" min={1} max={100} value={maxLeads}
              onChange={(e) => setMaxLeads(Math.max(1, Math.min(100, parseInt(e.target.value)||1)))}
              style={{ width: 70, padding: "6px 10px", borderRadius: 8, background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 20, fontWeight: 700, textAlign: "center", outline: "none" }} />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>entreprises</span>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {[5,10,25,50].map((n) => (
              <button key={n} onClick={() => setMaxLeads(n)} style={{
                flex: 1, padding: "4px 0", borderRadius: 6, border: "1px solid",
                borderColor: maxLeads===n ? "var(--accent)" : "var(--border)",
                background: maxLeads===n ? "var(--accent-bg)" : "transparent",
                color: maxLeads===n ? "var(--accent-light)" : "var(--muted)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* Présence web */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Présence web</div>
          {[
            { v: "no_website", label: "Sans site", icon: "🚫" },
            { v: "with_website", label: "Avec site", icon: "✅" },
            { v: "all", label: "Tous", icon: "📋" },
          ].map((o) => (
            <button key={o.v} onClick={() => setWebsiteFilter(o.v)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "7px 10px", borderRadius: 8, border: "1px solid", marginBottom: 4,
              borderColor: websiteFilter===o.v ? "var(--accent-border)" : "var(--border)",
              background: websiteFilter===o.v ? "var(--accent-bg)" : "transparent",
              color: websiteFilter===o.v ? "var(--accent-light)" : "var(--muted)",
              fontSize: 13, fontWeight: websiteFilter===o.v ? 600 : 400, cursor: "pointer",
            }}>
              <span>{o.icon}</span><span>{o.label}</span>
            </button>
          ))}
        </div>

        {/* Zone */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Zone</div>
          <div style={{ display: "flex", gap: 5 }}>
            {DISTANCES.map((d) => (
              <button key={d.value} onClick={() => setDistance(d.value)} style={{
                flex: 1, padding: "6px 4px", borderRadius: 8, border: "1px solid",
                borderColor: distance===d.value ? "var(--accent)" : "var(--border)",
                background: distance===d.value ? "var(--accent-bg)" : "transparent",
                color: distance===d.value ? "var(--accent-light)" : "var(--muted)",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}>
                <div>{d.label}</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>{d.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Secteurs */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Secteurs</div>
            {sectors.length > 0 && <span className="badge status-nouveau">{sectors.length}</span>}
          </div>
          <input className="input" placeholder="🔎 Filtrer…" value={sectorSearch} onChange={(e) => setSectorSearch(e.target.value)} style={{ marginBottom: 8, fontSize: 12 }} />
          <button onClick={() => setSectors(allSelected ? [] : SECTORS.map((s) => s.type))} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "6px 10px", borderRadius: 8, border: "1px solid", marginBottom: 6,
            borderColor: allSelected ? "var(--accent-border)" : "var(--border)",
            background: allSelected ? "var(--accent-bg)" : "transparent",
            color: allSelected ? "var(--accent-light)" : "var(--muted)",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            <span style={{ width:14, height:14, borderRadius:4, border:"2px solid", borderColor: allSelected?"var(--accent)":"var(--dim)", background: allSelected?"var(--accent)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"white" }}>{allSelected?"✓":""}</span>
            Tous ({SECTORS.length})
          </button>
          <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
            {filteredSectors.map((s) => {
              const on = sectors.includes(s.type);
              return (
                <button key={s.type} onClick={() => toggleSector(s.type)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, border: "1px solid",
                  borderColor: on ? "var(--accent-border)" : "transparent",
                  background: on ? "var(--accent-bg)" : "transparent",
                  color: on ? "var(--accent-light)" : "var(--muted)",
                  fontSize: 12, fontWeight: on?600:400, cursor: "pointer",
                }}>
                  <span>{s.icon}</span><span style={{ flex:1, textAlign:"left" }}>{s.label}</span>
                  {on && <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)" }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Zone principale */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Barre de recherche */}
        <div style={{ display: "flex", gap: 10 }}>
          <CityInput value={city} onChange={(v) => { setCity(v); setLocation(null); }} onSelect={(s) => setLocation({ lat: s.lat, lng: s.lng })} onSearch={handleSearch} />
          <button className="btn btn-primary" onClick={handleSearch} disabled={searching || !city.trim() || !sectors.length} style={{ minWidth: 140, justifyContent: "center" }}>
            {searching ? <span className="spinner" /> : "🔍"}
            {searching ? "Recherche…" : `Trouver ${maxLeads} leads`}
          </button>
          <SavedSearches onLoad={loadSaved} />
          {results.length > 0 && <button className="btn btn-ghost" onClick={exportCSV}>⬇ CSV</button>}
        </div>

        {error && <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--red-bg)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--red)", fontSize: 13 }}>⚠ {error}</div>}

        {/* Stats */}
        {stats && results.length > 0 && (
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {[
              { label: "Résultats", val: results.length, color: "var(--accent-light)" },
              { label: "Sans site", val: stats.noWebsite, color: "var(--green)" },
              { label: "Avec site", val: stats.withWebsite, color: "var(--muted)" },
            ].map((s) => (
              <div key={s.label} className="card" style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{s.label}</span>
              </div>
            ))}
            {provider && (
              <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: provider === "osm" ? "var(--yellow)" : "var(--green)", display: "inline-block" }} />
                Source : {provider === "serpapi" ? "Google Maps (SerpAPI)" : provider === "apify" ? "Google Maps (Apify)" : "OpenStreetMap (qualité réduite)"}
              </div>
            )}
          </div>
        )}

        {/* Résultats */}
        {results.length > 0 ? (
          <BusinessTable businesses={results} onAddToCRM={addToCRM} onAddAllToCRM={addAllToCRM} addedIds={addedIds} />
        ) : !searching && (
          <div className="card">
            <div className="empty">
              <div className="empty-icon">🗺️</div>
              <div className="empty-text">Entrez une ville et lancez la recherche.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
