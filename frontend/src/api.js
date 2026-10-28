/**
 * API base URL — proxied via Vite dev server to FastAPI backend.
 */
const API_BASE = "/api";

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ── Health ────────────────────────────────────────────────────────────────────
export const fetchHealth = () => request("GET", "/health");
export const fetchStats = () => request("GET", "/stats");

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const fetchTasks = () => request("GET", "/tasks/");
export const createTask = (data) => request("POST", "/tasks/", data);
export const updateTask = (id, data) => request("PUT", `/tasks/${id}`, data);
export const deleteTask = (id) => request("DELETE", `/tasks/${id}`);

// ── Services ──────────────────────────────────────────────────────────────────
export const fetchServices = () => request("GET", "/services/");
export const createService = (data) => request("POST", "/services/", data);
export const updateService = (id, data) => request("PUT", `/services/${id}`, data);
export const deleteService = (id) => request("DELETE", `/services/${id}`);

// ── Resources ─────────────────────────────────────────────────────────────────
export const fetchResources = () => request("GET", "/resources/");
export const createResource = (data) => request("POST", "/resources/", data);
export const updateResource = (id, data) => request("PUT", `/resources/${id}`, data);
export const deleteResource = (id) => request("DELETE", `/resources/${id}`);
