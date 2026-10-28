import { useState } from "react";
import StatusBadge from "./StatusBadge";

const EMPTY = {
  name: "", url: "", status: "unknown",
  response_time_ms: "", uptime_percent: "100", environment: "production",
};

function ServiceModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        response_time_ms: form.response_time_ms !== "" ? parseFloat(form.response_time_ms) : null,
        uptime_percent: form.uptime_percent !== "" ? parseFloat(form.uptime_percent) : 100,
      });
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-labelledby="svc-modal-title">
        <div className="modal-header">
          <span id="svc-modal-title" className="modal-title">
            {initial ? "✏️ Edit Service" : "➕ Add Service"}
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="svc-name">Service Name *</label>
              <input id="svc-name" className="form-input" required
                value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Auth API" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="svc-url">Endpoint URL *</label>
              <input id="svc-url" className="form-input" required
                value={form.url} onChange={(e) => set("url", e.target.value)}
                placeholder="https://api.example.com/health" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="svc-status">Status</label>
                <select id="svc-status" className="form-select"
                  value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="degraded">Degraded</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="svc-env">Environment</label>
                <select id="svc-env" className="form-select"
                  value={form.environment} onChange={(e) => set("environment", e.target.value)}>
                  <option value="production">Production</option>
                  <option value="staging">Staging</option>
                  <option value="development">Development</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="svc-rt">Response Time (ms)</label>
                <input id="svc-rt" className="form-input" type="number" min="0"
                  value={form.response_time_ms} onChange={(e) => set("response_time_ms", e.target.value)}
                  placeholder="e.g. 142" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="svc-up">Uptime %</label>
                <input id="svc-up" className="form-input" type="number" min="0" max="100" step="0.01"
                  value={form.uptime_percent} onChange={(e) => set("uptime_percent", e.target.value)}
                  placeholder="99.9" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : initial ? "Save Changes" : "Add Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServicesPage({ items, loading, error, add, update, remove }) {
  const [modal, setModal] = useState(null);

  if (loading) return <div className="spinner" />;
  if (error) return <div className="error-banner">⚠️ {error}</div>;

  const handleSave = async (form) => {
    if (modal === "create") await add(form);
    else await update(modal.id, form);
  };

  return (
    <>
      {modal && (
        <ServiceModal
          initial={modal !== "create" ? modal : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">🌐 Services <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "13px" }}>({items.length})</span></span>
          <button id="btn-add-service" className="btn btn-primary" onClick={() => setModal("create")}>
            + Add Service
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌐</div>
            <div className="empty-title">No services tracked</div>
            <div className="empty-sub">Add a service to start monitoring its status.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Response</th>
                  <th>Uptime</th>
                  <th>Env</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((svc) => (
                  <tr key={svc.id}>
                    <td style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
                      #{svc.id}
                    </td>
                    <td style={{ fontWeight: 500 }}>{svc.name}</td>
                    <td>
                      <a href={svc.url} target="_blank" rel="noreferrer"
                        style={{ color: "var(--accent-hover)", textDecoration: "none", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
                        {svc.url.length > 35 ? svc.url.slice(0, 35) + "…" : svc.url}
                      </a>
                    </td>
                    <td><StatusBadge value={svc.status} /></td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--text-secondary)" }}>
                      {svc.response_time_ms != null ? `${svc.response_time_ms} ms` : "—"}
                    </td>
                    <td>
                      <span style={{
                        color: svc.uptime_percent >= 99 ? "var(--green)"
                          : svc.uptime_percent >= 95 ? "var(--yellow)" : "var(--red)",
                        fontWeight: 600, fontSize: "13px",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {svc.uptime_percent != null ? `${Number(svc.uptime_percent).toFixed(2)}%` : "—"}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gray">{svc.environment}</span>
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-sm" id={`btn-edit-svc-${svc.id}`}
                          onClick={() => setModal(svc)}>Edit</button>
                        <button className="btn btn-danger btn-sm" id={`btn-del-svc-${svc.id}`}
                          onClick={() => { if (confirm("Remove this service?")) remove(svc.id); }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
