"use client";

interface NavItem { id: string; icon: string; label: string; badge?: number; }

interface Props {
  items: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  username: string;
  role: "admin" | "telepro";
  onLogout: () => void;
  businessName?: string;
  businessEmoji?: string;
  onChangeBusiness?: () => void;
}

export default function NavSidebar({ items, active, onSelect, username, role, onLogout, businessName, businessEmoji, onChangeBusiness }: Props) {
  return (
    <aside className="sidebar">
      {/* Logo + business */}
      <div className="sidebar-logo" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="sidebar-logo-icon">{businessEmoji || "🔍"}</div>
          <div>
            <div className="sidebar-logo-text">{businessName || "ProspectAI"}</div>
            <div className="sidebar-logo-sub">Prospection locale</div>
          </div>
        </div>
        {onChangeBusiness && (
          <button onClick={onChangeBusiness} style={{
            width: "100%", padding: "5px 8px", borderRadius: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
            color: "var(--muted)", fontSize: 11, cursor: "pointer", textAlign: "left",
          }}>
            ⇄ Changer de business
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => onSelect(item.id)}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && <span className="badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{role === "admin" ? "👑" : "🧑"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</div>
            <div className="user-role">{role === "admin" ? "Administrateur" : "Télépro"}</div>
          </div>
          <button onClick={onLogout} title="Déconnexion"
            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "2px 4px", flexShrink: 0 }}>
            ⏏
          </button>
        </div>
      </div>
    </aside>
  );
}
