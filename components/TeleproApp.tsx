"use client";

import { useState } from "react";
import NavSidebar from "./NavSidebar";
import CRMPage from "./CRMPage";
import CalendarPage from "./CalendarPage";

interface Props {
  session: { userId: string; username: string; role: "admin" | "telepro" };
  onLogout: () => void;
  businessId: string;
}

const NAV = [
  { id: "crm",      icon: "📋", label: "Mes leads" },
  { id: "calendar", icon: "📅", label: "Calendrier" },
];

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  crm:      { title: "Mes leads",  sub: "Les prospects qui vous ont été assignés" },
  calendar: { title: "Calendrier", sub: "Vos rappels et rendez-vous" },
};

export default function TeleproApp({ session, onLogout, businessId }: Props) {
  const [view, setView] = useState("crm");
  const page = PAGE_TITLES[view] || PAGE_TITLES.crm;

  return (
    <div className="layout">
      <NavSidebar
        items={NAV}
        active={view}
        onSelect={setView}
        username={session.username}
        role="telepro"
        onLogout={onLogout}
      />
      <div className="main">
        <div className="topbar">
          <div>
            <div className="page-title">{page.title}</div>
            <div className="page-sub">{page.sub}</div>
          </div>
        </div>
        <div className="content">
          {view === "crm"      && <CRMPage businessId={businessId} />}
          {view === "calendar" && <CalendarPage businessId={businessId} />}
        </div>
      </div>
    </div>
  );
}
