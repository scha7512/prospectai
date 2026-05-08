"use client";

import { useState, useEffect } from "react";
import { Business } from "@/app/api/search/route";

interface Telepro {
  id: string;
  username: string;
  created_at: string;
}

interface Props {
  selectedLeads: Business[];
}

export default function AdminPanel({ selectedLeads }: Props) {
  const [telepros, setTelepros] = useState<Telepro[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [assignTarget, setAssignTarget] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const loadTelepros = async () => {
    const res = await fetch("/api/users");
    if (res.ok) setTelepros(await res.json());
  };

  useEffect(() => { loadTelepros(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setCreating(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, password: newPassword }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setError(data.error); return; }
    setSuccess(`Compte "${data.username}" créé !`);
    setNewUsername(""); setNewPassword(""); setShowCreate(false);
    loadTelepros();
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Supprimer le compte "${username}" ?`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    loadTelepros();
  };

  const handleAssign = async () => {
    if (!assignTarget.length || !selectedLeads.length) return;
    setAssigning(true);
    const res = await fetch("/api/leads/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: assignTarget, businesses: selectedLeads }),
    });
    const data = await res.json();
    setAssigning(false);
    setSuccess(`${data.inserted} lead${data.inserted > 1 ? "s" : ""} envoyé${data.inserted > 1 ? "s" : ""} !`);
    setAssignTarget([]);
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div style={{
      background: "#16161e", border: "1px solid rgba(99,102,241,0.2)",
      borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>👥</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e8e8f0" }}>Gestion des télépros</span>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.3)",
          background: "rgba(99,102,241,0.12)", color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>+ Créer un compte</button>
      </div>

      {/* Formulaire création */}
      {showCreate && (
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Identifiant" style={{
              flex: 1, minWidth: 120, padding: "8px 12px", borderRadius: 9,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#e8e8f0", fontSize: 13, outline: "none",
            }} />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mot de passe" style={{
              flex: 1, minWidth: 120, padding: "8px 12px", borderRadius: 9,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#e8e8f0", fontSize: 13, outline: "none",
            }} />
          <button type="submit" disabled={creating || !newUsername || !newPassword} style={{
            padding: "8px 16px", borderRadius: 9, border: "none",
            background: "#6366f1", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>{creating ? "…" : "Créer"}</button>
        </form>
      )}

      {error && <p style={{ margin: 0, color: "#f87171", fontSize: 12 }}>⚠️ {error}</p>}
      {success && <p style={{ margin: 0, color: "#4ade80", fontSize: 12 }}>✓ {success}</p>}

      {/* Liste des télépros */}
      {telepros.length === 0 ? (
        <p style={{ margin: 0, color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Aucun télépro pour l&apos;instant.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {telepros.map((t) => (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 10,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{ fontSize: 16 }}>🧑‍💼</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#e8e8f0" }}>{t.username}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                {new Date(t.created_at).toLocaleDateString("fr-FR")}
              </span>
              {/* Case à cocher pour l'envoi */}
              <input
                type="checkbox"
                checked={assignTarget.includes(t.id)}
                onChange={(e) => setAssignTarget((prev) =>
                  e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id)
                )}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#6366f1" }}
              />
              <button onClick={() => handleDelete(t.id, t.username)} style={{
                background: "none", border: "none", color: "rgba(248,113,113,0.5)",
                cursor: "pointer", fontSize: 14, padding: "0 4px",
              }}>🗑️</button>
            </div>
          ))}
        </div>
      )}

      {/* Envoi de leads */}
      {telepros.length > 0 && (
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12,
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {assignTarget.length === 0
              ? "☑️ Cochez un ou plusieurs télépros ci-dessus"
              : `${assignTarget.length} télépro${assignTarget.length > 1 ? "s" : ""} sélectionné${assignTarget.length > 1 ? "s" : ""}`}
          </span>
          <button
            onClick={handleAssign}
            disabled={assigning || !assignTarget.length || !selectedLeads.length}
            style={{
              padding: "8px 18px", borderRadius: 10, border: "1px solid",
              borderColor: assignTarget.length && selectedLeads.length ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)",
              background: assignTarget.length && selectedLeads.length ? "rgba(74,222,128,0.12)" : "transparent",
              color: assignTarget.length && selectedLeads.length ? "#4ade80" : "rgba(255,255,255,0.25)",
              fontSize: 13, fontWeight: 700, cursor: assignTarget.length && selectedLeads.length ? "pointer" : "not-allowed",
            }}
          >
            {assigning ? "Envoi…" : `➤ Envoyer ${selectedLeads.length} lead${selectedLeads.length > 1 ? "s" : ""} au CRM`}
          </button>
        </div>
      )}
    </div>
  );
}
