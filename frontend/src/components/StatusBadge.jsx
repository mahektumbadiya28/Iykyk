/**
 * Renders a colored status badge based on the value string.
 */
export const STATUS_COLORS = {
  // Task statuses
  todo:        "badge-blue",
  in_progress: "badge-yellow",
  completed:   "badge-green",
  blocked:     "badge-red",
  // Priority
  low:         "badge-gray",
  medium:      "badge-blue",
  high:        "badge-yellow",
  critical:    "badge-red",
  // Service statuses
  online:      "badge-green",
  offline:     "badge-red",
  degraded:    "badge-yellow",
  unknown:     "badge-gray",
  // Resource statuses
  active:      "badge-green",
  inactive:    "badge-gray",
  maintenance: "badge-yellow",
  retired:     "badge-red",
};

const STATUS_DOTS = {
  online: "🟢", offline: "🔴", degraded: "🟡", unknown: "⚪",
  active: "🟢", inactive: "⚪", maintenance: "🟡", retired: "🔴",
  completed: "✓", in_progress: "◷", todo: "○", blocked: "✕",
};

export default function StatusBadge({ value }) {
  const cls = STATUS_COLORS[value] || "badge-gray";
  const dot = STATUS_DOTS[value] || "";
  return (
    <span className={`badge ${cls}`}>
      {dot && <span style={{ fontSize: "9px" }}>{dot}</span>}
      {value?.replace(/_/g, " ")}
    </span>
  );
}
