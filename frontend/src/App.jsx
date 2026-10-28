import { useState, useCallback } from "react";
import "./index.css";

import Sidebar from "./components/Sidebar";
import OverviewPage from "./components/OverviewPage";
import TasksPage from "./components/TasksPage";
import ServicesPage from "./components/ServicesPage";
import ResourcesPage from "./components/ResourcesPage";

import { useDashboard, useResource } from "./hooks/useDashboard";
import {
  fetchTasks, createTask, updateTask, deleteTask,
  fetchServices, createService, updateService, deleteService,
  fetchResources, createResource, updateResource, deleteResource,
} from "./api";

// Stable function references to avoid re-renders in useResource
const taskFns   = [fetchTasks,    createTask,    updateTask,    deleteTask];
const svcFns    = [fetchServices, createService, updateService, deleteService];
const resFns    = [fetchResources,createResource,updateResource,deleteResource];

function useNow() {
  const [now, setNow] = useState(new Date());
  useState(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  });
  return now;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");

  const { health, stats, loading: dashLoading, error: dashError, refresh } = useDashboard(30000);
  const tasks     = useResource(...taskFns);
  const services  = useResource(...svcFns);
  const resources = useResource(...resFns);

  const now = useNow();

  const apiStatus = dashError ? "offline" : health ? "online" : "checking";

  const PAGE_TITLES = {
    overview:  "Overview",
    tasks:     "Task Manager",
    services:  "Service Monitor",
    resources: "Resource Inventory",
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} apiStatus={apiStatus} />

      <div className="main-content">
        <header className="topbar">
          <h1 className="page-title">{PAGE_TITLES[activeTab]}</h1>
          <div className="topbar-right">
            <span className="timestamp">{now.toLocaleTimeString()}</span>
            <button
              id="btn-refresh"
              className="btn btn-ghost btn-sm"
              onClick={() => { refresh(); tasks.reload(); services.reload(); resources.reload(); }}
              title="Refresh all data"
            >
              ↻ Refresh
            </button>
          </div>
        </header>

        <main className="page-body">
          {dashError && <div className="error-banner">⚠️ Backend unreachable: {dashError}</div>}

          {activeTab === "overview"  && <OverviewPage stats={stats} health={health} />}
          {activeTab === "tasks"     && <TasksPage    {...tasks} />}
          {activeTab === "services"  && <ServicesPage {...services} />}
          {activeTab === "resources" && <ResourcesPage {...resources} />}
        </main>
      </div>
    </div>
  );
}
