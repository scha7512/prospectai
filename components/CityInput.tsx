"use client";

import { useState, useEffect, useRef } from "react";

interface Suggestion {
  display: string;
  short: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (s: Suggestion) => void;
  onSearch: () => void;
}

export default function CityInput({ value, onChange, onSelect, onSearch }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer si clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setSuggestions([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=jsonv2&limit=6&countrycodes=fr,be,ch,lu&addressdetails=1&accept-language=fr`,
          { headers: { "User-Agent": "ProspectAI/1.0 contact@prospectai.app" } }
        );
        const data = await res.json();
        const results: Suggestion[] = data
          .filter((r: Record<string, unknown>) => r.lat && r.lon)
          .map((r: Record<string, unknown>) => {
            const addr = (r.address as Record<string, string>) || {};
            const city = addr.city || addr.town || addr.village || addr.municipality || "";
            const dept = addr.county || addr.state_district || "";
            const country = addr.country || "";
            const short = [city, dept, country].filter(Boolean).join(", ");
            return {
              display: (r.display_name as string).split(",").slice(0, 4).join(", "),
              short: short || (r.display_name as string).split(",").slice(0, 3).join(", "),
              lat: parseFloat(r.lat as string),
              lng: parseFloat(r.lon as string),
            };
          });
        // Dédupliquer par short
        const seen = new Set<string>();
        const unique = results.filter((r) => {
          if (seen.has(r.short)) return false;
          seen.add(r.short);
          return true;
        });
        setSuggestions(unique);
        setOpen(unique.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [value]);

  const handleSelect = (s: Suggestion) => {
    onChange(s.short.split(",")[0].trim());
    onSelect(s);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} style={{ flex: 1, position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#16161e", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12, padding: "0 16px",
      }}>
        <span style={{ fontSize: 18, opacity: 0.4 }}>📍</span>
        <input
          type="text"
          placeholder="Ville, quartier… (ex : Fontenay, Lyon 6e, Bordeaux)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { setOpen(false); onSearch(); }
            if (e.key === "Escape") setOpen(false);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: "#e8e8f0", fontSize: 14, padding: "14px 0",
          }}
        />
        {loading && <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, flexShrink: 0 }} />}
        {value && !loading && (
          <button onClick={() => { onChange(""); setSuggestions([]); setOpen(false); }}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 18, padding: 0 }}>
            ×
          </button>
        )}
      </div>

      {/* Dropdown suggestions */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 200,
          background: "#1e1e2a", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(s)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "10px 16px", border: "none", background: "transparent",
                cursor: "pointer", borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e8f0" }}>
                {s.short.split(",")[0].trim()}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                {s.short.split(",").slice(1).join(",").trim()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
