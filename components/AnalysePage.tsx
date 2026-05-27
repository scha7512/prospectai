"use client";

import { useState } from "react";
import { AnalyseResult } from "@/app/api/analyse/route";

export interface AnalyseState {
  nom: string;
  ville: string;
  url: string;
  result: AnalyseResult | null;
}

interface Props {
  businessId?: string;
  state: AnalyseState;
  onStateChange: (s: AnalyseState) => void;
}

export default function AnalysePage({ businessId = "gensite", state, onStateChange }: Props) {
  const { nom, ville, url, result } = state;
  const setNom   = (v: string) => onStateChange({ ...state, nom: v });
  const setVille = (v: string) => onStateChange({ ...state, ville: v });
  const setUrl   = (v: string) => onStateChange({ ...state, url: v });
  const setResult = (v: AnalyseResult | null) => onStateChange({ ...state, result: v });

  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const analyse = async () => {
    if (!nom.trim() || !ville.trim()) { setError("Nom et ville requis"); return; }
    setLoading(true); setError(""); setResult(null); setSaved(false);
    try {
      const r = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nom.trim(), ville: ville.trim(), url: url.trim() || undefined, businessId }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Erreur inconnue"); return; }
      setResult(data);
    } catch { setError("Erreur réseau. Réessayez."); }
    finally { setLoading(false); }
  };

  const copyPhrase = (i: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(i); setTimeout(() => setCopied(null), 1500);
  };

  const addToCRM = async () => {
    if (!result) return;
    setSaving(true);
    const notes = result.phrases_accroche.map((p, i) => `${i+1}. ${p}`).join("\n");
    const fakeBusiness = {
      place_id: `analyse-${Date.now()}`,
      name: result.entreprise_nom,
      address: result.entreprise_adresse,
      phone: undefined,
      types: ["analyse_ia"],
      lat: 0, lng: 0,
      hasWebsite: result.a_site_web,
      website: result.site_web_url,
      isOpen: null,
    };
    const r = await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business: fakeBusiness, businessId }),
    });
    if (r.ok) {
      // Ajouter les notes et le score via PATCH
      const data = await r.json();
      if (data?.id) {
        await fetch(`/api/crm/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: `Score IA: ${result.score_prospection}/10\n\nPhrases d'accroche:\n${notes}\n\nConseil: ${result.conseil_global}` }),
        });
      }
    }
    setSaving(false); setSaved(true);
  };

  // Couleur du score
  const scoreColor = (s: number) => s >= 7 ? "#22c55e" : s >= 5 ? "#f59e0b" : "#ef4444";
  const scoreBg    = (s: number) => s >= 7 ? "rgba(34,197,94,0.1)" : s >= 5 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)";
  const scoreBorder = (s: number) => s >= 7 ? "rgba(34,197,94,0.3)" : s >= 5 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)";
  const scoreLabel = (s: number) => s >= 7 ? "Priorité haute" : s >= 5 ? "Priorité moyenne" : "Priorité basse";

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Formulaire */}
      <div className="card">
        <div className="card-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>🤖 Analyse Prospect IA</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Entrez les infos d'un prospect — l'IA analyse et génère vos phrases d'accroche
            </div>
          </div>
        </div>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                Nom de l'entreprise *
              </label>
              <input className="input" value={nom} onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Agence Dupont Immobilier"
                onKeyDown={(e) => e.key === "Enter" && analyse()} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                Ville *
              </label>
              <input className="input" value={ville} onChange={(e) => setVille(e.target.value)}
                placeholder="Ex: Lyon"
                onKeyDown={(e) => e.key === "Enter" && analyse()} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
              URL du site web (optionnel)
            </label>
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..." type="url" />
          </div>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--red-bg)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--red)", fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}
          <button className="btn btn-primary" onClick={analyse} disabled={loading || !nom.trim() || !ville.trim()}
            style={{ alignSelf: "flex-start", minWidth: 160, justifyContent: "center" }}>
            {loading ? <><span className="spinner" /> Analyse en cours…</> : "🔍 Analyser"}
          </button>
          {loading && (
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
              L'IA analyse le prospect… cela prend environ 5 secondes.
            </p>
          )}
        </div>
      </div>

      {/* Résultat */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease" }}>

          {/* Header résultat */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", borderBottom: "1px solid var(--border)" }}>
              {/* Score */}
              <div style={{
                padding: "16px 24px", borderRadius: 14, textAlign: "center", flexShrink: 0,
                background: scoreBg(result.score_prospection),
                border: `2px solid ${scoreBorder(result.score_prospection)}`,
              }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: scoreColor(result.score_prospection), lineHeight: 1 }}>
                  {result.score_prospection}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor(result.score_prospection), textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
                  /10
                </div>
                <div style={{ fontSize: 11, color: scoreColor(result.score_prospection), fontWeight: 600, marginTop: 6 }}>
                  {scoreLabel(result.score_prospection)}
                </div>
              </div>

              {/* Infos entreprise */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
                  {result.entreprise_nom}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
                  📍 {result.entreprise_adresse}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: result.a_site_web ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    color: result.a_site_web ? "#22c55e" : "#ef4444",
                    border: `1px solid ${result.a_site_web ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  }}>
                    {result.a_site_web ? "✓ A un site web" : "✗ Pas de site détecté"}
                  </span>
                  {result.note_google && (
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(250,204,21,0.1)", color: "#facc15", border: "1px solid rgba(250,204,21,0.25)" }}>
                      ⭐ {result.note_google}/5 ({result.nb_avis} avis)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Raison du score */}
            <div style={{ padding: "14px 24px", background: "var(--surface2)", fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>
              💡 {result.raison_score}
            </div>
          </div>

          {/* Problèmes détectés */}
          {result.problemes_detectes.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div style={{ fontWeight: 700, fontSize: 14 }}>⚠️ Problèmes détectés</div>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.problemes_detectes.map((p, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 14px", borderRadius: 10,
                    background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
                  }}>
                    <span style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }}>✗</span>
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phrases d'accroche */}
          {result.phrases_accroche.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div style={{ fontWeight: 700, fontSize: 14 }}>📞 Phrases d'accroche téléphonique</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Cliquez pour copier</div>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.phrases_accroche.map((phrase, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "14px 16px", borderRadius: 12,
                    background: "var(--surface2)", border: "1px solid var(--border2)",
                    transition: "border-color 0.1s",
                  }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                      background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
                      color: "var(--accent-light)", fontSize: 12, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{phrase}</span>
                    <button onClick={() => copyPhrase(i, phrase)} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                      {copied === i ? "✓ Copié" : "Copier"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conseil global */}
          {result.conseil_global && (
            <div className="card" style={{ borderLeft: "3px solid var(--accent)" }}>
              <div className="card-body">
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  💬 Conseil global
                </div>
                <p style={{ margin: 0, fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{result.conseil_global}</p>
              </div>
            </div>
          )}

          {/* Bouton ajouter au CRM */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            {saved ? (
              <div style={{ padding: "10px 20px", borderRadius: 10, background: "var(--green-bg)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", fontSize: 13, fontWeight: 700 }}>
                ✓ Ajouté au CRM !
              </div>
            ) : (
              <button onClick={addToCRM} disabled={saving} className="btn btn-success"
                style={{ padding: "10px 24px", fontSize: 14 }}>
                {saving ? <><span className="spinner" /> Ajout…</> : "➕ Ajouter au CRM"}
              </button>
            )}
            <button onClick={() => { onStateChange({ nom: "", ville: "", url: "", result: null }); setSaved(false); }}
              className="btn btn-ghost">
              Nouvelle analyse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
