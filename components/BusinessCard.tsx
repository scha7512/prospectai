"use client";

import { Business } from "@/app/api/search/route";
import { useState, useEffect } from "react";

const TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurant", cafe: "Café", bar: "Bar", bakery: "Boulangerie",
  beauty_salon: "Salon de beauté", hair_care: "Coiffeur", gym: "Salle de sport",
  laundry: "Laverie", clothing_store: "Vêtements", pharmacy: "Pharmacie",
  doctor: "Médecin", dentist: "Dentiste", car_repair: "Garage",
  plumber: "Plombier", electrician: "Électricien", locksmith: "Serrurier",
  florist: "Fleuriste", lodging: "Hôtel", real_estate_agency: "Agence immo",
  accounting: "Comptable",
};

interface Telepro { id: string; username: string; }

export function BusinessTable({ businesses, onAddToCRM, onAddAllToCRM, addedIds, businessId = "gensite", scrapedEmails = {} }: {
  businesses: Business[];
  onAddToCRM: (b: Business) => void;
  onAddAllToCRM: () => void;
  addedIds: Set<string>;
  businessId?: string;
  scrapedEmails?: Record<string, string | null | "loading">;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [telepros, setTelepros] = useState<Telepro[]>([]);
  const [sendTo, setSendTo] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");
  const [emailSending, setEmailSending] = useState<Record<string, boolean>>({});
  const [mailSentIds, setMailSentIds]   = useState<Set<string>>(new Set());

  const sendEmail = async (b: Business, force = false) => {
    const email = scrapedEmails[b.place_id];
    if (!email || email === "loading") return;
    if (mailSentIds.has(b.place_id) && !force) return;
    setEmailSending((p) => ({ ...p, [b.place_id]: true }));
    try {
      const r = await fetch("/api/crm/email/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: b.name, sector: b.types[0] }),
      });
      const { subject, body } = await r.json();
      const gmailUrl = `https://mail.google.com/mail/?authuser=tantonsacha@gmail.com&view=cm&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(gmailUrl, "_blank");
      setMailSentIds((p) => new Set([...p, b.place_id]));
    } catch { /* silencieux */ }
    finally { setEmailSending((p) => ({ ...p, [b.place_id]: false })); }
  };

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setTelepros(d);
    });
  }, []);

  const copyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const openMaps = (b: Business) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + " " + b.address)}`, "_blank");
  };

  const toggleAll = () => {
    if (checked.size === businesses.length) setChecked(new Set());
    else setChecked(new Set(businesses.map((b) => b.place_id)));
  };

  const toggleOne = (id: string) => {
    setChecked((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const sendSelected = async () => {
    if (!sendTo || !checked.size) return;
    setSending(true);
    const selected = businesses.filter((b) => checked.has(b.place_id));
    const r = await fetch("/api/leads/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [sendTo], businesses: selected }),
    });
    const d = await r.json();
    setSending(false);
    setSendMsg(`✓ ${d.inserted} lead${d.inserted > 1 ? "s" : ""} envoyé${d.inserted > 1 ? "s" : ""}`);
    setTimeout(() => setSendMsg(""), 3000);
    setChecked(new Set());
  };

  const allChecked = checked.size === businesses.length && businesses.length > 0;
  const someChecked = checked.size > 0;

  return (
    <div>
      {/* Barre d'action — envoi aux télépros */}
      {telepros.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          padding: "12px 16px", marginBottom: 12,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10,
        }}>
          <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>Envoyer à :</span>
          <select value={sendTo} onChange={(e) => setSendTo(e.target.value)} style={{
            padding: "6px 10px", borderRadius: 8, background: "var(--surface2)",
            border: "1px solid var(--border2)", color: "var(--text)", fontSize: 13, outline: "none", cursor: "pointer",
          }}>
            <option value="">— Choisir un télépro —</option>
            {telepros.map((t) => <option key={t.id} value={t.id}>{t.username}</option>)}
          </select>

          <button
            onClick={sendSelected}
            disabled={!sendTo || !someChecked || sending}
            className="btn btn-primary btn-sm"
          >
            {sending ? <span className="spinner" style={{ width: 12, height: 12 }} /> : "➤"}
            {someChecked ? `Envoyer ${checked.size} lead${checked.size > 1 ? "s" : ""}` : "Sélectionnez des leads"}
          </button>

          {sendMsg && <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 600 }}>{sendMsg}</span>}

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onAddAllToCRM}>
              + Tout ajouter à mon CRM
            </button>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" checked={allChecked} onChange={toggleAll}
                  style={{ width: 15, height: 15, cursor: "pointer", accentColor: "var(--accent)" }} />
              </th>
              {["Statut", "Nom", "Secteur", "Adresse", "Téléphone", "Site web", ...(businessId === "copywriting" ? ["Email"] : []), "Mon CRM", "Maps"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => (
              <tr key={b.place_id} style={{ background: checked.has(b.place_id) ? "rgba(99,102,241,0.05)" : undefined }}>

                {/* Checkbox */}
                <td>
                  <input type="checkbox" checked={checked.has(b.place_id)} onChange={() => toggleOne(b.place_id)}
                    style={{ width: 15, height: 15, cursor: "pointer", accentColor: "var(--accent)" }} />
                </td>

                {/* Statut ouverture */}
                <td style={{ whiteSpace: "nowrap" }}>
                  {b.isOpen === true && <span className="badge status-signe">🟢 Ouvert</span>}
                  {b.isOpen === false && <span className="badge status-pas_interesse">🔴 Fermé</span>}
                  {b.isOpen === null && <span className="badge" style={{ background: "rgba(255,255,255,0.05)", color: "var(--muted)", border: "1px solid var(--border)" }}>⚪</span>}
                </td>

                {/* Nom */}
                <td style={{ fontWeight: 600, whiteSpace: "nowrap", maxWidth: 180 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{b.name}</span>
                </td>

                {/* Secteur */}
                <td style={{ whiteSpace: "nowrap" }}>
                  <span className="badge status-nouveau">{TYPE_LABELS[b.types[0]] || b.types[0]}</span>
                </td>

                {/* Adresse */}
                <td style={{ color: "var(--muted)", maxWidth: 200 }}>
                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {b.address || "—"}
                  </span>
                </td>

                {/* Téléphone */}
                <td style={{ whiteSpace: "nowrap" }}>
                  {b.phone ? (
                    <button onClick={() => copyPhone(b.phone!, b.place_id)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: copied === b.place_id ? "var(--green)" : "var(--text)",
                      fontWeight: 500, fontSize: 13, padding: 0,
                    }}>
                      {copied === b.place_id ? "✓ Copié" : b.phone}
                    </button>
                  ) : <span style={{ color: "var(--dim)" }}>—</span>}
                </td>

                {/* Site web */}
                <td style={{ whiteSpace: "nowrap" }}>
                  {b.hasWebsite && b.website
                    ? <a href={b.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)", fontSize: 12, textDecoration: "none" }}>✓ Voir</a>
                    : <span className="badge status-pas_interesse">✗ Aucun</span>}
                </td>

                {/* Email — Copywriting seulement */}
                {businessId === "copywriting" && (() => {
                  const emailState = b.hasWebsite ? scrapedEmails[b.place_id] : null;
                  const isLoading  = emailState === "loading";
                  const email      = typeof emailState === "string" && emailState !== "loading" ? emailState : null;
                  const notFound   = !b.hasWebsite || (emailState === null && b.hasWebsite);
                  return (
                    <td style={{ whiteSpace: "nowrap", minWidth: 160 }}>
                      {isLoading && (
                        <span style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                          🔍 Recherche…
                        </span>
                      )}
                      {email && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{email}</span>
                          {mailSentIds.has(b.place_id) ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80" }}>✅ Mail envoyé</span>
                              <button onClick={() => { setMailSentIds((p) => { const n = new Set(p); n.delete(b.place_id); return n; }); sendEmail(b, true); }} style={{
                                background: "none", border: "none", padding: 0, cursor: "pointer",
                                fontSize: 10, color: "var(--muted)", textDecoration: "underline", textAlign: "left",
                              }}>Renvoyer</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => sendEmail(b)}
                              disabled={emailSending[b.place_id]}
                              style={{
                                padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(56,189,248,0.4)",
                                background: "rgba(56,189,248,0.08)", color: "#38bdf8",
                                fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                                opacity: emailSending[b.place_id] ? 0.6 : 1,
                              }}
                            >
                              {emailSending[b.place_id] ? "…" : "📧 Envoyer un mail"}
                            </button>
                          )}
                        </div>
                      )}
                      {notFound && !isLoading && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 11, color: "#f87171" }}>Aucun email</span>
                          {b.phone && (
                            <button onClick={() => { navigator.clipboard.writeText(b.phone!); }} style={{
                              padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(248,113,113,0.3)",
                              background: "rgba(248,113,113,0.06)", color: "#f87171",
                              fontSize: 11, fontWeight: 700, cursor: "pointer",
                            }}>
                              📞 Appeler
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })()}

                {/* Mon CRM */}
                <td style={{ whiteSpace: "nowrap" }}>
                  {addedIds.has(b.place_id)
                    ? <span style={{ color: "var(--green)", fontSize: 12, fontWeight: 600 }}>✓ Ajouté</span>
                    : <button onClick={() => onAddToCRM(b)} className="btn btn-success btn-sm">+ CRM</button>}
                </td>

                {/* Maps */}
                <td>
                  <button onClick={() => openMaps(b)} className="btn btn-ghost btn-sm">📍</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
