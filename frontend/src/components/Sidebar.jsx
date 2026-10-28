/**
 * Sidebar navigation component.
 */
export default function Sidebar({ activeTab, onTabChange, apiStatus }) {
  const navItems = [
    { id: "overview", icon: "⚡", label: "Overview" },
    { id: "tasks",    icon: "✅", label: "Tasks" },
    { id: "services", icon: "🌐", label: "Services" },
    { id: "resources",icon: "📦", label: "Resources" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">✦</div>
        <span className="logo-text">NexusDash</span>
      </div>

      <span className="nav-section-label">Navigation</span>
      {navItems.map((item) => (
        <div
          key={item.id}
          id={`nav-${item.id}`}
          className={`nav-item ${activeTab === item.id ? "active" : ""}`}
          onClick={() => onTabChange(item.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onTabChange(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}

      <div className="sidebar-status">
        <div className="api-badge">
          <span className={`status-dot ${apiStatus}`} />
          <span>API {apiStatus === "online" ? "Connected" : apiStatus === "offline" ? "Offline" : "Checking…"}</span>
        </div>
      </div>
    </aside>
  );
}
