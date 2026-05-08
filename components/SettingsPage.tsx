"use client";

import { useState, useEffect } from "react";
import { Business } from "@/app/api/search/route";

interface Telepro { id: string; username: string; created_at: string; }

interface Props { currentLeads: Business[]; }

export default function SettingsPage({ currentLeads }: Props) {
  const [telepros, setTelepros] = useState<Telepro[]>([]);
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const r = await fetch("/api/users");
    if (r.ok) setTelepros(await r.json());
  };
  useEffect(() => { load(); }, []);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUser, password: newPass }),
    });
    setCreating(false);
    const d = await r.json();
    if (!r.ok) { flash("err", d.error); return; }
    flash("ok", `Compte « ${d.username} » créé avec succès`);
    setNewUser(""); setNewPass(""); setShowForm(false);
    load();
  };

  const remove = async (id: string, username: string) => {
    if (!confirm(`Supprimer le compte « ${username} » ? Ses leads seront perdus.`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    setTelepros((p) => p.filter((t) => t.id !== id));
  };

  const assign = async () => {
    if (!selected.length || !currentLeads.length) return;
    setAssigning(true);
    const r = await fetch("/api/leads/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: selected, businesses: currentLeads }),
    });
    const d = await r.json();
    setAssigning(false);
    flash("ok", `${d.inserted} lead${d.inserted > 1 ? "s" : ""} envoyé${d.inserted > 1 ? "s" : ""}`);
    setSelected([]);
  };

  const toggle = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760 }}>

      {msg && (
        <div style={{
          padding: "10px 16px", borderRadius: 8,
          background: msg.type === "ok" ? "var(--green-bg)" : "var(--red-bg)",
          border: `1px solid ${msg.type === "ok" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)"}`,
          color: msg.type === "ok" ? "var(--green)" : "var(--red)",
          fontSize: 13, fontWeight: 500,
        }}>
          {msg.type === "ok" ? "✓" : "⚠"} {msg.text}
        </div>
      )}

      {/* Créer un compte */}
      <div className="card">
        <div className="card-header">
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Comptes télépros</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {telepros.length} télépro{telepros.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            + Créer un compte
          </button>
        </div>

        {showForm && (
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
            <form onSubmit={create} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Identifiant</label>
                <input className="input" value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="prenom.nom" />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Mot de passe</label>
                <input className="input" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="••••••••" />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={creating || !newUser || !newPass}>
                  {creating ? <span className="spinner" /> : "Créer"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        )}

        {/* Liste */}
        {telepros.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🧑‍💼</div>
            <div className="empty-text">Aucun compte télépro.<br />Créez-en un pour commencer.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Identifiant</th>
                <th>Créé le</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {telepros.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🧑</div>
                      <span style={{ fontWeight: 600 }}>{t.username}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{new Date(t.created_at).toLocaleDateString("fr-FR")}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(t.id, t.username)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Envoyer des leads */}
      <div className="card">
        <div className="card-header">
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Envoyer des leads</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {currentLeads.length > 0
                ? `${currentLeads.length} lead${currentLeads.length > 1 ? "s" : ""} disponible${currentLeads.length > 1 ? "s" : ""} (depuis la recherche)`
                : "Faites une recherche d'abord pour sélectionner des leads"}
            </div>
          </div>
          {selected.length > 0 && currentLeads.length > 0 && (
            <button className="btn btn-success" onClick={assign} disabled={assigning}>
              {assigning ? <span className="spinner" /> : "➤"}
              Envoyer à {selected.length} télépro{selected.length > 1 ? "s" : ""}
            </button>
          )}
        </div>

        {telepros.length === 0 ? (
          <div className="empty">
            <div className="empty-text">Créez d&apos;abord un compte télépro.</div>
          </div>
        ) : (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {telepros.map((t) => (
              <label key={t.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 10,
                border: `1px solid ${selected.includes(t.id) ? "var(--accent-border)" : "var(--border)"}`,
                background: selected.includes(t.id) ? "var(--accent-bg)" : "var(--surface2)",
                cursor: "pointer", transition: "all 0.12s",
              }}>
                <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggle(t.id)}
                  style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer" }} />
                <span style={{ fontSize: 16 }}>🧑‍💼</span>
                <span style={{ fontWeight: selected.includes(t.id) ? 600 : 400, color: selected.includes(t.id) ? "var(--accent-light)" : "var(--text)" }}>
                  {t.username}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
