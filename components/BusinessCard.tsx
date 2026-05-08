"use client";

import { Business } from "@/app/api/search/route";
import { useState } from "react";

const TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurant", cafe: "Café", bar: "Bar", bakery: "Boulangerie",
  beauty_salon: "Salon de beauté", hair_care: "Coiffeur", gym: "Salle de sport",
  laundry: "Laverie", clothing_store: "Vêtements", pharmacy: "Pharmacie",
  doctor: "Médecin", dentist: "Dentiste", car_repair: "Garage",
  plumber: "Plombier", electrician: "Électricien", locksmith: "Serrurier",
  florist: "Fleuriste", lodging: "Hôtel", real_estate_agency: "Agence immo",
  accounting: "Comptable",
};

export function BusinessTable({ businesses, onAddToCRM, onAddAllToCRM, addedIds }: {
  businesses: Business[];
  onAddToCRM: (b: Business) => void;
  onAddAllToCRM: () => void;
  addedIds: Set<string>;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const openMaps = (b: Business) => {
    const query = encodeURIComponent(`${b.name} ${b.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  return (
    <div>
      {/* Bouton tout ajouter */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button
          onClick={onAddAllToCRM}
          style={{
            padding: "8px 18px", borderRadius: 10,
            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
            color: "#818cf8", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          ➕ Tout ajouter au CRM ({businesses.filter(b => !addedIds.has(b.place_id)).length})
        </button>
      </div>
    <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {["Statut", "Nom", "Secteur", "Adresse", "Téléphone", "Site web", "Ajouter", "Actions"].map((h) => (
              <th key={h} style={{
                padding: "12px 16px", textAlign: "left", fontWeight: 600,
                fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
                letterSpacing: "0.06em", whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {businesses.map((b, i) => (
            <tr
              key={b.place_id}
              className="fade-up"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                animationDelay: `${i * 20}ms`,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)")}
            >
              {/* Statut */}
              <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                {b.isOpen === true && (
                  <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(34,197,94,0.12)", color: "#4ade80", fontSize: 11, fontWeight: 600, border: "1px solid rgba(34,197,94,0.2)" }}>
                    🟢 Ouvert
                  </span>
                )}
                {b.isOpen === false && (
                  <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(251,146,60,0.12)", color: "#fb923c", fontSize: 11, fontWeight: 600, border: "1px solid rgba(251,146,60,0.2)" }}>
                    🔴 À rappeler
                  </span>
                )}
                {b.isOpen === null && (
                  <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 500, border: "1px solid rgba(255,255,255,0.08)" }}>
                    ⚪ Inconnu
                  </span>
                )}
              </td>

              {/* Nom */}
              <td style={{ padding: "12px 16px", fontWeight: 600, color: "#e8e8f0", whiteSpace: "nowrap", maxWidth: 200 }}>
                {b.name}
              </td>

              {/* Secteur */}
              <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 6,
                  background: "rgba(99,102,241,0.12)", color: "#818cf8", fontSize: 11, fontWeight: 500,
                }}>
                  {TYPE_LABELS[b.types[0]] || b.types[0]}
                </span>
              </td>

              {/* Adresse */}
              <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", maxWidth: 220 }}>
                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.address || "—"}
                </span>
              </td>

              {/* Téléphone */}
              <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                {b.phone ? (
                  <button
                    onClick={() => copyPhone(b.phone!, b.place_id)}
                    title="Cliquer pour copier"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: copied === b.place_id ? "#4ade80" : "rgba(255,255,255,0.75)",
                      fontWeight: 500, fontSize: 13, padding: 0, display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    {copied === b.place_id ? "✓ Copié" : b.phone}
                  </button>
                ) : <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
              </td>

              {/* Site web */}
              <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                {b.hasWebsite && b.website ? (
                  <a href={b.website} target="_blank" rel="noopener noreferrer"
                    style={{ color: "#4ade80", fontSize: 12, textDecoration: "none" }}>
                    ✓ Voir le site
                  </a>
                ) : (
                  <span style={{
                    padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)",
                  }}>✗ Aucun</span>
                )}
              </td>

              {/* Ajouter au CRM */}
              <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                {addedIds.has(b.place_id) ? (
                  <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 600 }}>✓ Ajouté</span>
                ) : (
                  <button
                    onClick={() => onAddToCRM(b)}
                    style={{
                      padding: "5px 12px", borderRadius: 8,
                      background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
                      color: "#4ade80", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    + CRM
                  </button>
                )}
              </td>

              {/* Actions */}
              <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                <button
                  onClick={() => openMaps(b)}
                  style={{
                    padding: "5px 12px", borderRadius: 8,
                    background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                    color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  📍 Google Maps
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

