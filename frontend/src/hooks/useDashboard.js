import { useState, useEffect, useCallback } from "react";
import { fetchStats, fetchHealth } from "../api";

/**
 * Custom hook for polling API health and stats at a given interval.
 */
export function useDashboard(intervalMs = 30000) {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [h, s] = await Promise.all([fetchHealth(), fetchStats()]);
      setHealth(h);
      setStats(s);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { health, stats, loading, error, refresh };
}

/**
 * Generic hook for CRUD operations on any resource list.
 */
export function useResource(fetchFn, createFn, updateFn, deleteFn) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFn();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => { load(); }, [load]);

  const add = async (data) => {
    const item = await createFn(data);
    setItems((prev) => [item, ...prev]);
    return item;
  };

  const update = async (id, data) => {
    const item = await updateFn(id, data);
    setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
    return item;
  };

  const remove = async (id) => {
    await deleteFn(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return { items, loading, error, reload: load, add, update, remove };
}
