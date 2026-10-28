import { useState } from "react";
import StatusBadge from "./StatusBadge";

const EMPTY = {
  title: "", description: "", status: "todo",
  priority: "medium", assigned_to: "", due_date: "",
};

function TaskModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-labelledby="task-modal-title">
        <div className="modal-header">
          <span id="task-modal-title" className="modal-title">
            {initial ? "✏️ Edit Task" : "➕ New Task"}
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="task-title">Title *</label>
              <input id="task-title" className="form-input" required
                value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="Task title…" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="task-desc">Description</label>
              <textarea id="task-desc" className="form-textarea"
                value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Optional description…" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="task-status">Status</label>
                <select id="task-status" className="form-select"
                  value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-priority">Priority</label>
                <select id="task-priority" className="form-select"
                  value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="task-assigned">Assigned To</label>
                <input id="task-assigned" className="form-input"
                  value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)}
                  placeholder="Name or team…" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-due">Due Date</label>
                <input id="task-due" className="form-input" type="date"
                  value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : initial ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage({ items, loading, error, add, update, remove }) {
  const [modal, setModal] = useState(null); // null | "create" | task object

  if (loading) return <div className="spinner" />;
  if (error) return <div className="error-banner">⚠️ {error}</div>;

  const handleSave = async (form) => {
    if (modal === "create") {
      await add(form);
    } else {
      await update(modal.id, form);
    }
  };

  return (
    <>
      {modal && (
        <TaskModal
          initial={modal !== "create" ? modal : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">✅ Tasks <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "13px" }}>({items.length})</span></span>
          <button id="btn-add-task" className="btn btn-primary" onClick={() => setModal("create")}>
            + Add Task
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No tasks yet</div>
            <div className="empty-sub">Click "Add Task" to create your first task.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((task) => (
                  <tr key={task.id}>
                    <td style={{ color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
                      #{task.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{task.title}</div>
                      {task.description && (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {task.description.slice(0, 60)}{task.description.length > 60 ? "…" : ""}
                        </div>
                      )}
                    </td>
                    <td><StatusBadge value={task.status} /></td>
                    <td><StatusBadge value={task.priority} /></td>
                    <td style={{ color: "var(--text-secondary)" }}>{task.assigned_to || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
                      {task.due_date || "—"}
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-ghost btn-sm" id={`btn-edit-task-${task.id}`}
                          onClick={() => setModal(task)}>Edit</button>
                        <button className="btn btn-danger btn-sm" id={`btn-del-task-${task.id}`}
                          onClick={() => { if (confirm("Delete this task?")) remove(task.id); }}>
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
