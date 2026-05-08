"use client";

import { useEffect, useState } from "react";
import AdminApp from "./AdminApp";
import TeleptoApp from "./TeleproApp";

interface Session { userId: string; username: string; role: "admin" | "telepro"; }

export default function AppShell() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.username) setSession(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
    </div>
  );

  if (!session) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (session.role === "admin") return <AdminApp session={session} onLogout={logout} />;
  return <TeleptoApp session={session} onLogout={logout} />;
}
