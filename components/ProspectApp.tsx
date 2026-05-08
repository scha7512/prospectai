"use client";

import { useState } from "react";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import { BusinessTable } from "./BusinessCard";
import SavedSearches from "./SavedSearches";
import CRMPage from "./CRMPage";
import CityInput from "./CityInput";
import AdminPanel from "./AdminPanel";
import { Business } from "@/app/api/search/route";
import { saveSearch, SavedSearch } from "@/lib/storage";
import { SECTORS } from "@/lib/constants";

interface SearchState {
  results: Business[];
  totalFound: number;
  noWebsiteCount: number;
  withWebsiteCount: number;
}

export default function ProspectApp() {
  const [locationInput, setLocationInput] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(["restaurant"]);
  const [distance, setDistance] = useState("ville");
  const [websiteFilter, setWebsiteFilter] = useState("no_website");
  const [maxLeads, setMaxLeads] = useState(10);
  const [searchState, setSearchState] = useState<SearchState | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"search" | "crm">("search");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [session, setSession] = useState<{ username: string; role: "admin" | "telepro" } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.username) setSession({ username: d.username, role: d.role });
    });
  }, []);

  const handleSectorToggle = (type: string) => {
    setSelectedSectors((prev) =>
      prev.includes(type) ? prev.filter((s) => s !== type) : [...prev, type]
    );
  };

  const doSearch = async (lat: number, lng: number, opts?: {
    sectors?: string[]; dist?: string; wf?: string; ml?: number;
  }) => {
    const sectors = opts?.sectors ?? selectedSectors;
    const dist = opts?.dist ?? distance;
    const wf = opts?.wf ?? websiteFilter;
    const ml = opts?.ml ?? maxLeads;

    if (sectors.length === 0) {
      setError("Sélectionnez au moins un secteur.");
      return;
    }

    setIsSearching(true);
    setError(null);

    // Lancer une requête par secteur en parallèle
    const perSector = Math.ceil(ml / sectors.length);
    try {
      const promises = sectors.map((type) => {
        const params = new URLSearchParams({
          location: `${lat},${lng}`,
          distance: dist,
          type,
          websiteFilter: wf,
          maxLeads: String(perSector),
        });
        return fetch(`/api/search?${params}`).then((r) => r.json());
      });

      const allData = await Promise.all(promises);

      // Fusionner et dédupliquer
      const seen = new Set<string>();
      const merged: Business[] = [];
      let totalFound = 0;
      let noWebsite = 0;
      let withWebsite = 0;

      for (const data of allData) {
        totalFound += data.total_found || 0;
        noWebsite += data.no_website_count || 0;
        withWebsite += data.with_website_count || 0;
        for (const b of data.results || []) {
          if (!seen.has(b.place_id)) {
            seen.add(b.place_id);
            merged.push(b);
          }
        }
      }

      // Trier : ouverts > inconnus > fermés, limiter au max
      const open = merged.filter((b) => b.isOpen === true);
      const unknown = merged.filter((b) => b.isOpen === null);
      const closed = merged.filter((b) => b.isOpen === false);
      const results = [...open, ...unknown, ...closed].slice(0, ml);

      setSearchState({ results, totalFound, noWebsiteCount: noWebsite, withWebsiteCount: withWebsite });

      // Sauvegarder automatiquement
      const sectorLabels = sectors.map((s) => SECTORS.find((x) => x.type === s)?.label || s);
      saveSearch({
        label: `${locationInput} — ${sectorLabels.join(", ")}`,
        city: locationInput,
        sectors,
        date: new Date().toISOString(),
        results,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!locationInput.trim()) return;
    setError(null);

    let loc = resolvedLocation;
    if (!loc) {
      setIsSearching(true);
      try {
        const geo = await fetch(`/api/geocode?address=${encodeURIComponent(locationInput)}`);
        if (!geo.ok) {
          const err = await geo.json();
          throw new Error(err.error || "Ville introuvable");
        }
        const geoData = await geo.json();
        loc = { lat: geoData.lat, lng: geoData.lng };
        setResolvedLocation(loc);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur");
        setIsSearching(false);
        return;
      }
    }
    await doSearch(loc.lat, loc.lng);
  };

  const handleFilterChange = async (patch: {
    sectors?: string[]; dist?: string; wf?: string; ml?: number;
  }) => {
    if (patch.sectors !== undefined) setSelectedSectors(patch.sectors);
    if (patch.dist !== undefined) setDistance(patch.dist);
    if (patch.wf !== undefined) setWebsiteFilter(patch.wf);
    if (patch.ml !== undefined) setMaxLeads(patch.ml);
    if (resolvedLocation) {
      await doSearch(resolvedLocation.lat, resolvedLocation.lng, {
        sectors: patch.sectors ?? selectedSectors,
        dist: patch.dist ?? distance,
        wf: patch.wf ?? websiteFilter,
        ml: patch.ml ?? maxLeads,
      });
    }
  };

  const handleLoadSearch = (search: SavedSearch) => {
    setLocationInput(search.city);
    setSelectedSectors(search.sectors);
    setSearchState({
      results: search.results,
      totalFound: search.results.length,
      noWebsiteCount: search.results.filter((b) => !b.hasWebsite).length,
      withWebsiteCount: search.results.filter((b) => b.hasWebsite).length,
    });
    setResolvedLocation(null);
  };

  const handleAddToCRM = async (b: Business) => {
    await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business: b }),
    });
    setAddedIds((prev) => new Set([...prev, b.place_id]));
  };

  const handleAddAllToCRM = async () => {
    if (!searchState?.results) return;
    await Promise.all(
      searchState.results.map((b) =>
        fetch("/api/crm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ business: b }),
        })
      )
    );
    setAddedIds((prev) => new Set([...prev, ...searchState.results.map((b) => b.place_id)]));
  };

  const handleExportCSV = () => {
    if (!searchState?.results.length) return;
    const header = ["Statut", "Nom", "Secteur", "Adresse", "Téléphone", "Site web"];
    const rows = searchState.results.map((b) => [
      b.isOpen === true ? "Ouvert" : b.isOpen === false ? "À rappeler" : "Inconnu",
      `"${b.name}"`, `"${b.types[0] || ""}"`, `"${b.address}"`,
      `"${b.phone || ""}"`, `"${b.website || ""}"`,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospectai-${locationInput}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", padding: 24, gap: 24, maxWidth: 1500, margin: "0 auto" }}>
      <Sidebar
        selectedSectors={selectedSectors}
        onSectorToggle={(t) => {
          const next = selectedSectors.includes(t)
            ? selectedSectors.filter((s) => s !== t)
            : [...selectedSectors, t];
          handleFilterChange({ sectors: next });
        }}
        distance={distance}
        onDistanceChange={(d) => handleFilterChange({ dist: d })}
        websiteFilter={websiteFilter}
        onWebsiteFilterChange={(w) => handleFilterChange({ wf: w })}
        maxLeads={maxLeads}
        onMaxLeadsChange={(ml) => { setMaxLeads(ml); }}
        stats={searchState ? {
          total: searchState.totalFound,
          noWebsite: searchState.noWebsiteCount,
          withWebsite: searchState.withWebsiteCount,
        } : null}
        view={view}
        onViewChange={setView}
        crmCount={addedIds.size}
        onSelectAllSectors={() => handleFilterChange({ sectors: SECTORS.map((s) => s.type) })}
        onClearSectors={() => handleFilterChange({ sectors: [] })}
      />

      {view === "crm" && <div style={{ flex: 1, minWidth: 0 }}><CRMPage /></div>}

      {view === "search" && <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header utilisateur */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
          {session && (
            <>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                {session.role === "admin" ? "👑" : "🧑‍💼"} {session.username}
              </span>
              <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
                style={{ padding: "4px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer" }}>
                Déconnexion
              </button>
            </>
          )}
        </div>

        {/* Barre de recherche */}
        <div style={{ display: "flex", gap: 10 }}>
          <CityInput
            value={locationInput}
            onChange={(val) => { setLocationInput(val); setResolvedLocation(null); }}
            onSelect={(s) => setResolvedLocation({ lat: s.lat, lng: s.lng })}
            onSearch={handleSearch}
          />

          <button
            className="btn-primary"
            onClick={handleSearch}
            disabled={isSearching || !locationInput.trim() || selectedSectors.length === 0}
            style={{ padding: "0 24px", fontSize: 14, display: "flex", alignItems: "center", gap: 8, minWidth: 140 }}
          >
            {isSearching ? <span className="spinner" /> : "🔍"}
            {isSearching ? "Recherche…" : `Trouver ${maxLeads} leads`}
          </button>

          <SavedSearches onLoad={handleLoadSearch} />

          {searchState?.results.length ? (
            <button onClick={handleExportCSV} style={{
              padding: "0 16px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              ⬇️ CSV
            </button>
          ) : null}
        </div>

        {/* Erreur */}
        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171", fontSize: 13,
          }}>⚠️ {error}</div>
        )}

        {/* État vide */}
        {!searchState && !isSearching && !error && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, paddingTop: 80 }}>
            <div style={{ fontSize: 56 }}>🗺️</div>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#e8e8f0" }}>Trouvez vos prochains clients</h2>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.35)", maxWidth: 420 }}>
                Entrez une ville, sélectionnez un ou plusieurs secteurs, et lancez la recherche.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {["Lyon", "Paris", "Marseille", "Bordeaux", "Nantes", "Toulouse"].map((city) => (
                <button key={city} onClick={() => setLocationInput(city)} style={{
                  padding: "6px 14px", borderRadius: 20,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer",
                }}>{city}</button>
              ))}
            </div>
          </div>
        )}

        {/* Résultats */}
        {searchState && !isSearching && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                <span style={{ color: "#818cf8", fontWeight: 600 }}>{searchState.results.length}</span> lead{searchState.results.length !== 1 ? "s" : ""}
                {" "}· {searchState.noWebsiteCount} sans site · {searchState.withWebsiteCount} avec site
              </p>
            </div>
            {searchState.results.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
                  Aucun résultat. Essayez une zone plus large ou un autre secteur.
                </p>
              </div>
            ) : (
              <>
                {session?.role === "admin" && (
                  <AdminPanel selectedLeads={searchState.results} />
                )}
                <BusinessTable
                  businesses={searchState.results}
                  onAddToCRM={handleAddToCRM}
                  onAddAllToCRM={handleAddAllToCRM}
                  addedIds={addedIds}
                />
              </>
            )}
          </>
        )}

        {/* Chargement */}
        {isSearching && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, paddingTop: 80 }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
              Recherche sur {selectedSectors.length} secteur{selectedSectors.length > 1 ? "s" : ""}…
            </p>
          </div>
        )}
      </div>
      }
    </div>
  );
}
