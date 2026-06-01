import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  FiBarChart2,
  FiCalendar,
  FiCheckSquare,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiSettings,
} from "react-icons/fi";
import { addDays, format } from "date-fns";
import TasksPage from "./pages/TasksPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CalendarPage from "./pages/CalendarPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import AIChat from "./components/AIChat";
import AppErrorBoundary from "./components/AppErrorBoundary";
import useAppContext from "./hooks/useAppContext";
import "./App.css";

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const didInitRef = useRef(false);
  const [viewMode, setViewMode] = useState("list");
  const [chatOpen, setChatOpen] = useState(true);
  const {
    tasks,
    progress,
    selectedDate,
    filters,
    notifications,
    setSelectedDate,
    setFilters,
    refreshAll,
    removeNotification,
    loadTasks,
  } = useAppContext();

  useEffect(() => {
    if (didInitRef.current) {
      return;
    }
    didInitRef.current = true;
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const timers = notifications.map((notification) =>
      window.setTimeout(() => removeNotification(notification.id), 4200)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  const todayKey = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const tomorrowKey = useMemo(() => format(addDays(new Date(), 1), "yyyy-MM-dd"), []);

  const clearFilters = async () => {
    await setFilters({
      status: "all",
      category: "all",
      priority: "all",
    });
  };

  const pageTitle =
    location.pathname === "/analytics"
      ? "Analytics"
      : location.pathname === "/calendar"
        ? "Calendar"
        : location.pathname === "/settings"
          ? "Settings"
          : "Tasks";

  return (
    <div className="app-shell app-shell--workspace">
      <header className="workspace-header">
        <div className="brand">
          <h1>Tracker</h1>
          <span>{pageTitle} for disciplined, visible progress</span>
        </div>

        <div className="workspace-header__controls">
          <div className="date-control">
            <button className="ghost-button" type="button" onClick={() => setSelectedDate(todayKey)}>
              Today
            </button>
            <button className="ghost-button" type="button" onClick={() => setSelectedDate(tomorrowKey)}>
              Tomorrow
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>

          <div className="view-toggle">
            <button
              className={`ghost-button ${viewMode === "list" ? "toggle-chip--active" : ""}`}
              type="button"
              onClick={() => setViewMode("list")}
            >
              <FiList />
              List
            </button>
            <button
              className={`ghost-button ${viewMode === "calendar" ? "toggle-chip--active" : ""}`}
              type="button"
              onClick={() => setViewMode("calendar")}
            >
              <FiGrid />
              Calendar
            </button>
          </div>

          <button className="button secondary" type="button" onClick={() => navigate("/settings")}>
            <FiSettings />
            Settings
          </button>
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="workspace-sidebar">
          <nav className="workspace-nav">
            <NavLink className={({ isActive }) => `workspace-nav__link${isActive ? " active" : ""}`} to="/">
              <FiCheckSquare />
              Tasks
            </NavLink>
            <NavLink
              className={({ isActive }) => `workspace-nav__link${isActive ? " active" : ""}`}
              to="/analytics"
            >
              <FiBarChart2 />
              Analytics
            </NavLink>
            <NavLink
              className={({ isActive }) => `workspace-nav__link${isActive ? " active" : ""}`}
              to="/calendar"
            >
              <FiCalendar />
              Calendar
            </NavLink>
          </nav>

          <div className="card sidebar-card">
            <h3>Quick stats</h3>
            <p className="stat">{progress.today?.completionPercentage || 0}%</p>
            <p className="meta">
              {progress.today?.completedTasks || 0} of {progress.today?.totalTasks || 0} tasks
              completed today
            </p>
          </div>

          <div className="card sidebar-card">
            <div className="section-header">
              <h3>Filters</h3>
              <button className="ghost-button" type="button" onClick={clearFilters}>
                Reset
              </button>
            </div>
            <label className="task-meta">
              Status
              <select
                value={filters.status}
                onChange={(event) => setFilters({ status: event.target.value })}
              >
                <option value="all">all</option>
                <option value="pending">pending</option>
                <option value="in-progress">in-progress</option>
                <option value="completed">completed</option>
              </select>
            </label>
            <label className="task-meta">
              Category
              <select
                value={filters.category}
                onChange={(event) => setFilters({ category: event.target.value })}
              >
                <option value="all">all</option>
                <option value="work">work</option>
                <option value="health">health</option>
                <option value="personal">personal</option>
                <option value="learning">learning</option>
                <option value="other">other</option>
              </select>
            </label>
            <label className="task-meta">
              Priority
              <select
                value={filters.priority}
                onChange={(event) => setFilters({ priority: event.target.value })}
              >
                <option value="all">all</option>
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
            </label>
          </div>
        </aside>

        <main className="workspace-main">
          <AppErrorBoundary>
            <Routes>
              <Route path="/" element={<TasksPage viewMode={viewMode} />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/tasks" element={<Navigate to="/" replace />} />
              <Route path="/insights" element={<Navigate to="/analytics" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppErrorBoundary>
        </main>

        <aside className={`workspace-ai ${chatOpen ? "" : "workspace-ai--collapsed"}`}>
          <div className="workspace-ai__toggle">
            <button
              className="ghost-button"
              type="button"
              onClick={() => setChatOpen((prev) => !prev)}
            >
              {chatOpen ? <FiChevronRight /> : <FiChevronLeft />}
              {chatOpen ? "Collapse" : "Open AI"}
            </button>
          </div>

          {chatOpen ? (
            <>
              <AIChat contextTasks={tasks} />
              <div className="card sidebar-card">
                <h3>Quick actions</h3>
                <div className="quick-action-list">
                  <button className="ghost-button" type="button" onClick={() => refreshAll()}>
                    <FiRefreshCw />
                    Refresh data
                  </button>
                  <button className="ghost-button" type="button" onClick={() => navigate("/analytics")}>
                    <FiBarChart2 />
                    Open analytics
                  </button>
                  <button className="ghost-button" type="button" onClick={() => loadTasks({})}>
                    <FiCpu />
                    Reload tasks
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </aside>
      </div>

      <div className="toast-stack">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            className={`toast toast--${notification.type}`}
            onClick={() => removeNotification(notification.id)}
          >
            {notification.message}
          </button>
        ))}
      </div>

      <footer className="workspace-footer">
        <span>About: Tracker helps turn daily intent into visible momentum.</span>
        <a href="mailto:feedback@tracker.local">Feedback</a>
      </footer>
    </div>
  );
};

export default App;
