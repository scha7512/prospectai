"use client";

import { useState } from "react";
import NavSidebar from "./NavSidebar";
import CRMPage from "./CRMPage";
import SettingsPage from "./SettingsPage";
import SearchPage from "./SearchPage";
import CalendarPage from "./CalendarPage";
import AnalysePage from "./AnalysePage";
import { Business } from "@/app/api/search/route";
import { getBusinessConfig } from "@/lib/businesses";

interface Props {
  session: { userId: string; username: string; role: "admin" | "telepro" };
  onLogout: () => void;
  businessId: string;
  onChangeBusiness?: () => void;
}

const NAV = [
  { id: "search",   icon: "🔍", label: "Recherche" },
  { id: "analyse",  icon: "🤖", label: "Analyse IA" },
  { id: "crm",      icon: "📋", label: "Mon CRM" },
  { id: "calendar", icon: "📅", label: "Calendrier" },
  { id: "settings", icon: "⚙️", label: "Paramètres" },
];

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  search:   { title: "Recherche de leads",    sub: "Trouvez des entreprises sans site web" },
  analyse:  { title: "Analyse Prospect IA",   sub: "Analysez un prospect et générez vos phrases d'accroche" },
  crm:      { title: "Mon CRM",               sub: "Gérez vos prospects" },
  calendar: { title: "Calendrier",            sub: "Vos rappels et rendez-vous" },
  settings: { title: "Paramètres",            sub: "Gestion de l'équipe et des comptes" },
};

export default function AdminApp({ session, onLogout, businessId, onChangeBusiness }: Props) {
  const [view, setView] = useState("search");
  const [searchLeads, setSearchLeads] = useState<Business[]>([]);

  const page = PAGE_TITLES[view] || PAGE_TITLES.search;
  const biz = getBusinessConfig(businessId);

  return (
    <div className="layout">
      <NavSidebar
        items={NAV}
        active={view}
        onSelect={setView}
        username={session.username}
        role="admin"
        onLogout={onLogout}
        businessName={biz.name}
        businessEmoji={biz.emoji}
        onChangeBusiness={onChangeBusiness}
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
          {view === "search"   && <SearchPage onResultsChange={setSearchLeads} businessId={businessId} />}
          {view === "analyse"  && <AnalysePage businessId={businessId} />}
          {view === "crm"      && <CRMPage businessId={businessId} />}
          {view === "calendar" && <CalendarPage businessId={businessId} />}
          {view === "settings" && <SettingsPage currentLeads={searchLeads} businessId={businessId} />}
        </div>
      </div>
    </div>
  );
}
