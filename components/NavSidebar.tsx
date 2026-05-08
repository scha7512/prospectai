"use client";

interface NavItem {
  id: string;
  icon: string;
  label: string;
  badge?: number;
}

interface Props {
  items: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  username: string;
  role: "admin" | "telepro";
  onLogout: () => void;
}

export default function NavSidebar({ items, active, onSelect, username, role, onLogout }: Props) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🔍</div>
        <div>
          <div className="sidebar-logo-text">ProspectAI</div>
          <div className="sidebar-logo-sub">Prospection locale</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? "active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{role === "admin" ? "👑" : "🧑"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {username}
            </div>
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
