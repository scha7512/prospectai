"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Erreur de connexion");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0d0d12",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 380, background: "#16161e",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, padding: 40,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, margin: "0 auto 12px",
          }}>🔍</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#e8e8f0" }}>ProspectAI</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            Connectez-vous à votre espace
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>
              IDENTIFIANT
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="votre.identifiant"
              autoComplete="username"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#e8e8f0", fontSize: 14, outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>
              MOT DE PASSE
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#e8e8f0", fontSize: 14, outline: "none",
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171", fontSize: 13,
            }}>⚠️ {error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              padding: "13px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white", fontSize: 15, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading || !username || !password ? 0.5 : 1,
              marginTop: 4,
            }}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
