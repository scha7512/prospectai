"use client";

import { SECTORS, RADIUS_OPTIONS } from "@/lib/constants";

interface SidebarProps {
  selectedSectors: string[];
  onSectorToggle: (type: string) => void;
  radius: string;
  onRadiusChange: (r: string) => void;
  stats: { total: number; noWebsite: number } | null;
  isSearching: boolean;
}

export default function Sidebar({
  selectedSectors,
  onSectorToggle,
  radius,
  onRadiusChange,
  stats,
  isSearching,
}: SidebarProps) {
  return (
    <aside className="w-72 shrink-0 flex flex-col gap-4 p-4 glass rounded-2xl h-fit sticky top-6">
      {/* Logo */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.416A48.001 48.001 0 0112 20c-.834 0-1.655-.048-2.464-.14l-.347-.416z"
            />
          </svg>
        </div>
        <span className="font-bold text-lg gradient-text">ProspectAI</span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-white/40 mt-0.5">Trouvés</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-indigo-400">{stats.noWebsite}</p>
            <p className="text-xs text-white/40 mt-0.5">Sans site</p>
          </div>
        </div>
      )}

      {isSearching && (
        <div className="glass rounded-xl p-3 flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <p className="text-xs text-white/50">Recherche en cours…</p>
        </div>
      )}

      {/* Rayon */}
      <div>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Rayon</p>
        <div className="grid grid-cols-3 gap-1.5">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onRadiusChange(opt.value)}
              className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                radius === opt.value
                  ? "bg-indigo-500 text-white accent-glow"
                  : "glass text-white/50 hover:text-white/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secteurs */}
      <div>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Secteur</p>
        <div className="flex flex-col gap-1">
          {SECTORS.map((sector) => {
            const active = selectedSectors.includes(sector.type);
            return (
              <button
                key={sector.type}
                onClick={() => onSectorToggle(sector.type)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                    : "glass text-white/50 hover:text-white/80 glass-hover"
                }`}
              >
                <span className="text-base">{sector.icon}</span>
                <span className="flex-1 text-left">{sector.label}</span>
                {active && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
