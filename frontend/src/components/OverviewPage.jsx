/**
 * Overview dashboard with summary stat cards.
 */
export default function OverviewPage({ stats, health }) {
  if (!stats) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <div className="empty-title">Loading overview…</div>
      </div>
    );
  }

  const cards = [
    {
      label: "Tasks",
      icon: "✅",
      bg: "var(--blue-bg)",
      color: "var(--blue)",
      accent: "linear-gradient(90deg, var(--blue), var(--accent))",
      value: stats.tasks.total,
      sub: [
        { label: "Completed", value: stats.tasks.completed, color: "var(--green)" },
        { label: "In Progress", value: stats.tasks.in_progress, color: "var(--yellow)" },
        { label: "Pending", value: stats.tasks.pending, color: "var(--text-secondary)" },
      ],
    },
    {
      label: "Services",
      icon: "🌐",
      bg: "var(--green-bg)",
      color: "var(--green)",
      accent: "linear-gradient(90deg, var(--green), #059669)",
      value: stats.services.total,
      sub: [
        { label: "Online",  value: stats.services.online,  color: "var(--green)" },
        { label: "Offline", value: stats.services.offline, color: "var(--red)" },
        { label: "Degraded",value: stats.services.degraded,color: "var(--yellow)" },
      ],
    },
    {
      label: "Resources",
      icon: "📦",
      bg: "var(--purple-bg)",
      color: "var(--purple)",
      accent: "linear-gradient(90deg, var(--purple), var(--accent))",
      value: stats.resources.total,
      sub: [
        { label: "Active",   value: stats.resources.active,  color: "var(--green)" },
        { label: "Inactive", value: stats.resources.inactive,color: "var(--text-secondary)" },
      ],
    },
    {
      label: "API Status",
      icon: "⚡",
      bg: health?.status === "OK" ? "var(--green-bg)" : "var(--red-bg)",
      color: health?.status === "OK" ? "var(--green)" : "var(--red)",
      accent: health?.status === "OK"
        ? "linear-gradient(90deg, var(--green), #059669)"
        : "linear-gradient(90deg, var(--red), #b91c1c)",
      value: health?.status === "OK" ? "OK" : "ERR",
      sub: [
        { label: "Version", value: health?.version || "—", color: "var(--text-secondary)" },
      ],
    },
  ];

  return (
    <>
      <div className="stats-grid">
        {cards.map((card) => (
          <div
            key={card.label}
            className="stat-card"
            style={{ "--card-accent": card.accent }}
          >
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-value" style={{ color: card.color }}>
              {card.value}
            </div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-sub">
              {card.sub.map((s) => (
                <div key={s.label} className="stat-sub-item">
                  <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
                  <span style={{ color: "var(--text-muted)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">⚡ System Information</span>
        </div>
        <div className="panel-body">
          <table>
            <tbody>
              <tr>
                <td style={{ color: "var(--text-muted)", width: "200px" }}>API Version</td>
                <td>{health?.version || "—"}</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-muted)" }}>Server Time</td>
                <td>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>
                    {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "—"}
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-muted)" }}>Service Name</td>
                <td>{health?.service || "—"}</td>
              </tr>
              <tr>
                <td style={{ color: "var(--text-muted)" }}>Status</td>
                <td>
                  <span className={`badge ${health?.status === "OK" ? "badge-green" : "badge-red"}`}>
                    {health?.status || "Unknown"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
