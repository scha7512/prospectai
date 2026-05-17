"use client";

import { BUSINESSES } from "@/lib/businesses";

interface Props {
  onSelect: (businessId: string) => void;
  username: string;
}

export default function BusinessPicker({ onSelect, username }: Props) {
  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
        }}>🔍</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f0f0f8" }}>
          Bonjour, {username} 👋
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
          Quel espace voulez-vous ouvrir ?
        </p>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", gap: 20 }}>
        {BUSINESSES.map((biz) => (
          <button
            key={biz.id}
            onClick={() => onSelect(biz.id)}
            style={{
              width: 240, padding: "32px 24px", borderRadius: 20,
              background: "#111118", border: `2px solid rgba(255,255,255,0.08)`,
              cursor: "pointer", textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = biz.accentColor;
              e.currentTarget.style.background = biz.accentBg;
              e.currentTarget.style.transform = "translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.background = "#111118";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: biz.accentBg, border: `2px solid ${biz.accentBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
            }}>
              {biz.emoji}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f0f0f8", marginBottom: 6 }}>
                {biz.name}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                {biz.description}
              </div>
            </div>
            <div style={{
              width: "100%", padding: "10px", borderRadius: 12,
              background: biz.accentBg, border: `1px solid ${biz.accentBorder}`,
              color: biz.accentLight, fontSize: 13, fontWeight: 700,
            }}>
              Ouvrir →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
