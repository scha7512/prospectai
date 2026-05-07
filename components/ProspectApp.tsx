"use client";

import { useState, useCallback } from "react";
import { Search, MapPin, Download, ChevronRight } from "lucide-react";
import Sidebar from "./Sidebar";
import BusinessCard from "./BusinessCard";
import { Business } from "@/app/api/search/route";
import { SECTORS } from "@/lib/constants";

interface SearchState {
  results: Business[];
  nextPageToken: string | null;
  totalFound: number;
  noWebsiteCount: number;
}

export default function ProspectApp() {
  const [locationInput, setLocationInput] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(["restaurant"]);
  const [radius, setRadius] = useState("5000");
  const [searchState, setSearchState] = useState<SearchState | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSectorToggle = (type: string) => {
    setSelectedSectors((prev) =>
      prev.includes(type) ? prev.filter((s) => s !== type) : [...prev, type]
    );
  };

  const geocodeLocation = async (address: string) => {
    const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    if (!res.ok) throw new Error("Localisation introuvable");
    return res.json();
  };

  const fetchResults = useCallback(
    async (lat: number, lng: number, pagetoken?: string, append = false) => {
      const sectorsToSearch = selectedSectors.length > 0 ? selectedSectors : ["establishment"];

      const allResults: Business[] = append ? (searchState?.results || []) : [];
      let lastToken: string | null = null;
      let totalFound = 0;
      let noWebsiteCount = 0;

      for (const sector of sectorsToSearch) {
        const params = new URLSearchParams({
          location: `${lat},${lng}`,
          radius,
          type: sector,
          query: SECTORS.find((s) => s.type === sector)?.label || sector,
        });
        if (pagetoken) params.set("pagetoken", pagetoken);

        const res = await fetch(`/api/search?${params}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || err.error || "Erreur de recherche");
        }
        const data = await res.json();
        allResults.push(...data.results);
        totalFound += data.total_found;
        noWebsiteCount += data.no_website_count;
        if (data.next_page_token) lastToken = data.next_page_token;
      }

      // Deduplicate by place_id
      const seen = new Set<string>();
      const unique = allResults.filter((b) => {
        if (seen.has(b.place_id)) return false;
        seen.add(b.place_id);
        return true;
      });

      setSearchState({ results: unique, nextPageToken: lastToken, totalFound, noWebsiteCount });
    },
    [selectedSectors, radius, searchState]
  );

  const handleSearch = async () => {
    if (!locationInput.trim()) return;
    setError(null);
    setIsSearching(true);
    setHasSearched(true);

    try {
      let loc = resolvedLocation;
      if (!loc || loc.label !== locationInput) {
        const geo = await geocodeLocation(locationInput);
        loc = { lat: geo.lat, lng: geo.lng, label: locationInput };
        setResolvedLocation(loc);
      }
      await fetchResults(loc.lat, loc.lng);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    if (!resolvedLocation || !searchState?.nextPageToken) return;
    setIsLoadingMore(true);
    try {
      await fetchResults(resolvedLocation.lat, resolvedLocation.lng, searchState.nextPageToken, true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleExportCSV = () => {
    if (!searchState?.results.length) return;
    const header = ["Nom", "Secteur", "Adresse", "Téléphone", "Email"];
    const rows = searchState.results.map((b) => [
      `"${b.name}"`,
      `"${b.types[0] || ""}"`,
      `"${b.address}"`,
      `"${b.phone || ""}"`,
      `"${b.email || ""}"`,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospectai-${locationInput.replace(/\s/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-6 flex flex-col gap-6">
      {/* Top bar */}
      <header className="flex items-center gap-4">
        {/* Search bar */}
        <div className="flex-1 flex items-center gap-2 glass rounded-2xl px-4 py-3 focus-within:border-indigo-500/50 transition-colors">
          <MapPin size={18} className="text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Ville, quartier ou adresse… (ex: Lyon, Paris 11e)"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 bg-transparent outline-none text-white placeholder-white/25 text-sm"
          />
          {locationInput && (
            <button
              onClick={() => { setLocationInput(""); setResolvedLocation(null); }}
              className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        <button
          onClick={handleSearch}
          disabled={isSearching || !locationInput.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all accent-glow"
        >
          <Search size={16} />
          {isSearching ? "Recherche…" : "Chercher"}
        </button>

        {searchState?.results.length ? (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl glass text-white/60 hover:text-white/90 text-sm font-medium transition-colors"
          >
            <Download size={16} />
            CSV
          </button>
        ) : null}
      </header>

      <div className="flex gap-6 items-start">
        {/* Sidebar */}
        <Sidebar
          selectedSectors={selectedSectors}
          onSectorToggle={handleSectorToggle}
          radius={radius}
          onRadiusChange={setRadius}
          stats={
            searchState
              ? { total: searchState.totalFound, noWebsite: searchState.noWebsiteCount }
              : null
          }
          isSearching={isSearching}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {!hasSearched && (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white/80 mb-2">Trouvez vos prochains clients</h2>
                <p className="text-white/35 text-sm max-w-md">
                  Entrez une ville ou un quartier, sélectionnez un secteur dans les filtres, et ProspectAI identifie
                  toutes les entreprises locales sans site web.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Lyon", "Paris 11e", "Marseille", "Bordeaux"].map((city) => (
                  <button
                    key={city}
                    onClick={() => setLocationInput(city)}
                    className="px-3 py-1.5 glass rounded-xl text-xs text-white/50 hover:text-white/80 transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="glass rounded-2xl p-4 border border-red-500/30 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {hasSearched && !isSearching && searchState && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/40 text-sm">
                  <span className="text-indigo-400 font-semibold">{searchState.results.length}</span> entreprise{searchState.results.length !== 1 ? "s" : ""} sans site web
                  {resolvedLocation && <span className="text-white/25"> · {locationInput}</span>}
                </p>
              </div>

              {searchState.results.length === 0 ? (
                <div className="glass rounded-2xl p-10 text-center">
                  <p className="text-white/40 text-sm">Aucune entreprise sans site trouvée dans ce secteur. Essayez un autre secteur ou augmentez le rayon.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {searchState.results.map((b, i) => (
                    <BusinessCard key={b.place_id} business={b} index={i} />
                  ))}
                </div>
              )}

              {searchState.nextPageToken && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl glass hover:bg-white/10 text-white/60 hover:text-white/90 text-sm font-medium transition-all disabled:opacity-40"
                  >
                    {isLoadingMore ? "Chargement…" : "Charger plus"}
                    {!isLoadingMore && <ChevronRight size={16} />}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
