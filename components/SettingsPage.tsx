"use client";

import { useState, useEffect } from "react";
import { Business } from "@/app/api/search/route";

interface Telepro { id: string; username: string; plain_password: string; created_at: string; }

interface Props { currentLeads: Business[]; }

export default function SettingsPage({ currentLeads }: Props) {
  const [telepros, setTelepros] = useState<Telepro[]>([]);
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  // Édition inline
  const [editing, setEditing] = useState<Record<string, { username: string; password: string; showPass: boolean }>>({});

  const load = async () => {
    const r = await fetch("/api/users");
    if (r.ok) setTelepros(await r.json());
  };
  useEffect(() => { load(); }, []);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 3000);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    const r = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUser, password: newPass }),
    });
    setCreating(false);
    const d = await r.json();
    if (!r.ok) { flash("err", d.error); return; }
    flash("ok", `Compte « ${d.username} » créé`);
    setNewUser(""); setNewPass(""); setShowForm(false); load();
  };

  const remove = async (id: string, username: string) => {
    if (!confirm(`Supprimer « ${username} » ?`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setTelepros((p) => p.filter((t) => t.id !== id));
  };

  const startEdit = (t: Telepro) => {
    setEditing((p) => ({ ...p, [t.id]: { username: t.username, password: t.plain_password || "", showPass: false } }));
  };

  const saveEdit = async (id: string) => {
    const e = editing[id]; if (!e) return;
    const r = await fetch(`/api/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: e.username, password: e.password || undefined }),
    });
    const d = await r.json();
    if (!r.ok) { flash("err", d.error || "Erreur"); return; }
    flash("ok", "Modifié avec succès");
    setEditing((p) => { const n = { ...p }; delete n[id]; return n; });
    load();
  };

  const cancelEdit = (id: string) => setEditing((p) => { const n = { ...p }; delete n[id]; return n; });

  const toggleShowPass = (id: string) =>
    setEditing((p) => ({ ...p, [id]: { ...p[id], showPass: !p[id]?.showPass } }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 800 }}>

      {msg && (
        <div style={{
          padding: "10px 16px", borderRadius: 8,
          background: msg.type === "ok" ? "var(--green-bg)" : "var(--red-bg)",
          border: `1px solid ${msg.type === "ok" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)"}`,
          color: msg.type === "ok" ? "var(--green)" : "var(--red)", fontSize: 13, fontWeight: 500,
        }}>
          {msg.type === "ok" ? "✓" : "⚠"} {msg.text}
        </div>
      )}

      {/* Carte comptes */}
      <div className="card">
        <div className="card-header">
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Comptes télépros</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{telepros.length} compte{telepros.length !== 1 ? "s" : ""}</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Nouveau compte</button>
        </div>

        {/* Formulaire création */}
        {showForm && (
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
            <form onSubmit={create} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Identifiant</label>
                <input className="input" value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="prenom.nom" />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Mot de passe</label>
                <input className="input" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="mot de passe" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={creating || !newUser || !newPass}>
                {creating ? <span className="spinner" /> : "Créer"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
            </form>
          </div>
        )}

        {/* Liste */}
        {telepros.length === 0 ? (
          <div className="empty"><div className="empty-icon">🧑‍💼</div><div className="empty-text">Aucun compte.</div></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {telepros.map((t, i) => {
              const e = editing[t.id];
              return (
                <div key={t.id} style={{
                  padding: "16px 20px",
                  borderBottom: i < telepros.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  {e ? (
                    /* Mode édition */
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Identifiant</label>
                        <input className="input" value={e.username} onChange={(ev) => setEditing((p) => ({ ...p, [t.id]: { ...p[t.id], username: ev.target.value } }))} />
                      </div>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Nouveau mot de passe</label>
                        <div style={{ display: "flex", gap: 6 }}>
                          <input className="input" type={e.showPass ? "text" : "password"} value={e.password}
                            onChange={(ev) => setEditing((p) => ({ ...p, [t.id]: { ...p[t.id], password: ev.target.value } }))}
                            placeholder="Laisser vide = inchangé" style={{ flex: 1 }} />
                          <button type="button" onClick={() => toggleShowPass(t.id)} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                            {e.showPass ? "🙈" : "👁"}
                          </button>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => saveEdit(t.id)}>Sauvegarder</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => cancelEdit(t.id)}>Annuler</button>
                    </div>
                  ) : (
                    /* Mode lecture */
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🧑</div>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{t.username}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                          Créé le {new Date(t.created_at).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      {/* Identifiant & MDP visibles */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ padding: "6px 12px", borderRadius: 8, background: "var(--surface2)", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Identifiant</div>
                          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{t.username}</div>
                        </div>
                        <div style={{ padding: "6px 12px", borderRadius: 8, background: "var(--surface2)", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>Mot de passe</div>
                          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>
                            {t.plain_password || <span style={{ color: "var(--dim)", fontStyle: "italic", fontFamily: "inherit", fontWeight: 400 }}>non renseigné</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(t)}>✏️ Modifier</button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(t.id, t.username)}>Supprimer</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info leads disponibles */}
      {currentLeads.length > 0 && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--accent-bg)", border: "1px solid var(--accent-border)", fontSize: 13, color: "var(--accent-light)" }}>
          💡 {currentLeads.length} lead{currentLeads.length > 1 ? "s" : ""} disponible{currentLeads.length > 1 ? "s" : ""} depuis ta dernière recherche. Sélectionne-les dans la page Recherche pour les envoyer.
        </div>
      )}
    </div>
  );
}
