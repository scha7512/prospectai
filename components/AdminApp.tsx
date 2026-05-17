"use client";

import { useState } from "react";
import NavSidebar from "./NavSidebar";
import CRMPage from "./CRMPage";
import SettingsPage from "./SettingsPage";
import SearchPage from "./SearchPage";
import CalendarPage from "./CalendarPage";
import { Business } from "@/app/api/search/route";

interface Props {
  session: { userId: string; username: string; role: "admin" | "telepro" };
  onLogout: () => void;
}

const NAV = [
  { id: "search",   icon: "🔍", label: "Recherche" },
  { id: "crm",      icon: "📋", label: "Mon CRM" },
  { id: "calendar", icon: "📅", label: "Calendrier" },
  { id: "settings", icon: "⚙️", label: "Paramètres" },
];

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  search:   { title: "Recherche de leads", sub: "Trouvez des entreprises sans site web" },
  crm:      { title: "Mon CRM",            sub: "Gérez vos prospects" },
  calendar: { title: "Calendrier",         sub: "Vos rappels et rendez-vous" },
  settings: { title: "Paramètres",         sub: "Gestion de l'équipe et des comptes" },
};

export default function AdminApp({ session, onLogout }: Props) {
  const [view, setView] = useState("search");
  const [searchLeads, setSearchLeads] = useState<Business[]>([]);

  const page = PAGE_TITLES[view] || PAGE_TITLES.search;

  return (
    <div className="layout">
      <NavSidebar
        items={NAV}
        active={view}
        onSelect={setView}
        username={session.username}
        role="admin"
        onLogout={onLogout}
      />
      <div className="main">
        <div className="topbar">
          <div>
            <div className="page-title">{page.title}</div>
            <div className="page-sub">{page.sub}</div>
          </div>
          {view === "search" && searchLeads.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setView("settings")}>
              ➤ Envoyer {searchLeads.length} leads à l&apos;équipe
            </button>
          )}
        </div>

        <div className="content">
          {view === "search"   && <SearchPage onResultsChange={setSearchLeads} />}
          {view === "crm"      && <CRMPage />}
          {view === "calendar" && <CalendarPage />}
          {view === "settings" && <SettingsPage currentLeads={searchLeads} />}
        </div>
      </div>
    </div>
  );
}
