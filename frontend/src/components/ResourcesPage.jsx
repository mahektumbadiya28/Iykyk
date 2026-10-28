import { useState } from "react";
import StatusBadge from "./StatusBadge";

const EMPTY = {
  name: "", category: "", status: "active",
  quantity: "1", unit_cost: "", location: "", owner: "", tags: "",
};

function ResourceModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? { ...initial, quantity: String(initial.quantity), unit_cost: initial.unit_cost != null ? String(initial.unit_cost) : "" } : EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        quantity: parseInt(form.quantity, 10) || 1,
        unit_cost: form.unit_cost !== "" ? parseFloat(form.unit_cost) : null,
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
      <div className="modal" role="dialog" aria-labelledby="res-modal-title">
        <div className="modal-header">
          <span id="res-modal-title" className="modal-title">
            {initial ? "✏️ Edit Resource" : "➕ Add Resource"}
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="res-name">Name *</label>
                <input id="res-name" className="form-input" required
                  value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Resource name…" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="res-category">Category *</label>
                <input id="res-category" className="form-input" required
                  value={form.category} onChange={(e) => set("category", e.target.value)}
                  placeholder="e.g. Hardware, License…" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="res-status">Status</label>
                <select id="res-status" className="form-select"
                  value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="res-qty">Quantity</label>
                <input id="res-qty" className="form-input" type="number" min="0"
                  value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="res-cost">Unit Cost ($)</label>
                <input id="res-cost" className="form-input" type="number" min="0" step="0.01"
                  value={form.unit_cost} onChange={(e) => set("unit_cost", e.target.value)}
                  placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="res-owner">Owner</label>
                <input id="res-owner" className="form-input"
                  value={form.owner} onChange={(e) => set("owner", e.target.value)}
                  placeholder="Team or person…" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="res-location">Location</label>
              <input id="res-location" className="form-input"
                value={form.location} onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Server Room A, Cloud - AWS us-east-1" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="res-tags">Tags (comma-separated)</label>
              <input id="res-tags" className="form-input"
                value={form.tags} onChange={(e) => set("tags", e.target.value)}
                placeholder="e.g. critical, cloud, prod" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : initial ? "Save Changes" : "Add Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResourcesPage({ items, loading, error, add, update, remove }) {
  const [modal, setModal] = useState(null);

  if (loading) return <div className="spinner" />;
  if (error) return <div className="error-banner">⚠️ {error}</div>;

  const handleSave = async (form) => {
    if (modal === "create") await add(form);
    else await update(modal.id, form);
  };

  const totalValue = items.reduce((acc, r) => acc + (r.unit_cost || 0) * (r.quantity || 1), 0);

  return (
    <>
      {modal && (
        <ResourceModal
          initial={modal !== "create" ? modal : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">
            📦 Resources <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "13px" }}>({items.length})</span>
            {totalValue > 0 && (
              <span style={{ fontSize: "13px", color: "var(--green)", fontWeight: 600, marginLeft: "12px" }}>
                Total: ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            )}
          </span>
          <button id="btn-add-resource" className="btn btn-primary" onClick={() => setModal("create")}>
            + Add Resource
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">No resources yet</div>
            <div className="empty-sub">Add assets, licenses, or hardware to your inventory.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Location</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((res) => (
                  <tr key={res.id}>
                    <td style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
                      #{res.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{res.name}</div>
                      {res.owner && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>👤 {res.owner}</div>}
                    </td>
                    <td><span className="badge badge-purple">{res.category}</span></td>
                    <td><StatusBadge value={res.status} /></td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{res.quantity}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--text-secondary)" }}>
                      {res.unit_cost != null ? `$${Number(res.unit_cost).toFixed(2)}` : "—"}
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{res.location || "—"}</td>
                    <td>
                      {res.tags
                        ? res.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                          <span key={t} className="badge badge-gray" style={{ marginRight: 3 }}>{t}</span>
                        ))
                        : "—"}
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-sm" id={`btn-edit-res-${res.id}`}
                          onClick={() => setModal(res)}>Edit</button>
                        <button className="btn btn-danger btn-sm" id={`btn-del-res-${res.id}`}
                          onClick={() => { if (confirm("Delete this resource?")) remove(res.id); }}>
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
