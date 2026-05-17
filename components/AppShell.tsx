"use client";

import { useEffect, useState } from "react";
import AdminApp from "./AdminApp";
import TeleproApp from "./TeleproApp";
import BusinessPicker from "./BusinessPicker";
import { getBusinessConfig } from "@/lib/businesses";

interface Session { userId: string; username: string; role: "admin" | "telepro"; }

// Applique le thème couleur d'un business sur les variables CSS
function applyTheme(businessId: string) {
  const biz = getBusinessConfig(businessId);
  const root = document.documentElement;
  root.style.setProperty("--accent",        biz.accentColor);
  root.style.setProperty("--accent-light",  biz.accentLight);
  root.style.setProperty("--accent-bg",     biz.accentBg);
  root.style.setProperty("--accent-border", biz.accentBorder);
}

const OWNER_USERNAME = "sacha.tanton"; // seul ce compte voit le sélecteur

export default function AppShell() {
  const [session, setSession]       = useState<Session | null>(null);
  const [loading, setLoading]       = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.username) setSession(d); })
      .finally(() => setLoading(false));
  }, []);

  // Restaurer le business depuis sessionStorage (pas localStorage — reset à chaque onglet)
  useEffect(() => {
    const saved = sessionStorage.getItem("prospectai_business");
    if (saved) { setBusinessId(saved); applyTheme(saved); }
  }, []);

  const selectBusiness = (id: string) => {
    sessionStorage.setItem("prospectai_business", id);
    setBusinessId(id);
    applyTheme(id);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    sessionStorage.removeItem("prospectai_business");
    window.location.href = "/login";
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <div className="spinner" style={{ width:28, height:28, borderWidth:3 }} />
    </div>
  );

  if (!session) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  // Sélecteur business uniquement pour le propriétaire sans business choisi
  const isOwner = session.username === OWNER_USERNAME;
  if (isOwner && !businessId) {
    return <BusinessPicker username={session.username} onSelect={selectBusiness} />;
  }

  const currentBusiness = businessId || "gensite";

  if (session.role === "admin") {
    return <AdminApp session={session} onLogout={logout} businessId={currentBusiness} onChangeBusiness={isOwner ? () => { sessionStorage.removeItem("prospectai_business"); setBusinessId(null); } : undefined} />;
  }
  return <TeleproApp session={session} onLogout={logout} businessId={currentBusiness} />;
}
