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
  FiSun,
  FiMoon,
  FiMenu,
  FiMessageSquare,
  FiDownload,
  FiFileText,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const {
    tasks,
    progress,
    selectedDate,
    filters,
    notifications,
    theme,
    toggleTheme,
    sendAIMessage,
    addNotification,
    setSelectedDate,
    setFilters,
    loadInitialData,
    refreshCore,
    removeNotification,
    loadTasks,
  } = useAppContext();

  useEffect(() => {
    if (didInitRef.current) {
      return;
    }
    didInitRef.current = true;
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const timers = notifications.map((notification) =>
      window.setTimeout(() => removeNotification(notification.id), 4200)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  // Close mobile drawers on navigation
  useEffect(() => {
    setSidebarOpen(false);
    setAiOpen(false);
  }, [location.pathname]);

  // Swipe gesture navigation
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipeGesture();
  };

  const handleSwipeGesture = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const threshold = 120; // threshold for a swipe
    if (Math.abs(swipeDistance) < threshold) return;

    const paths = ["/", "/analytics", "/calendar", "/settings"];
    const currentIndex = paths.indexOf(location.pathname);
    if (currentIndex === -1) return;

    if (swipeDistance > 0) {
      // Swiped left -> Go to next tab
      if (currentIndex < paths.length - 1) {
        navigate(paths[currentIndex + 1]);
      }
    } else {
      // Swiped right -> Go to previous tab
      if (currentIndex > 0) {
        navigate(paths[currentIndex - 1]);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl + N: focus new task input
      if (event.ctrlKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        const input = document.querySelector('input[placeholder="Write a clear task"]');
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      
      // Ctrl + S: submit task form or closest active save button
      if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        const activeElement = document.activeElement;
        if (activeElement) {
          const form = activeElement.closest("form");
          if (form) {
            form.requestSubmit();
          } else {
            const editor = activeElement.closest('[class*="editor"]');
            if (editor) {
              const saveBtn = editor.querySelector('button[class*="primary"]');
              if (saveBtn) saveBtn.click();
            }
          }
        }
      }

      // Escape: Close modals or drawers
      if (event.key === "Escape") {
        const closeBtn = document.querySelector(".insight-modal__header button, .modal-close-btn");
        if (closeBtn) {
          closeBtn.click();
        }
        setSidebarOpen(false);
        setAiOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Export tasks of selectedDate to CSV
  const handleExportCSV = () => {
    if (!tasks || tasks.length === 0) {
      addNotification("No tasks available to export for this date.", "info");
      return;
    }
    const headers = ["Title", "Description", "Category", "Priority", "Status", "Date", "Time Spent (min)", "AI Insight"];
    const rows = tasks.map((t) => [
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      t.category || "other",
      t.priority || "medium",
      t.status || "pending",
      format(new Date(t.date), "yyyy-MM-dd"),
      t.timeSpent || 0,
      `"${(t.aiInsight || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tracker_tasks_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification("Tasks exported to CSV.", "success");
  };

  // Download chart/stats SVG as PNG image
  const handleDownloadStatsImage = () => {
    const svgElement = document.querySelector(".recharts-wrapper svg");
    if (!svgElement) {
      addNotification("No active chart found. Go to Analytics to download.", "info");
      return;
    }
    try {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = svgElement.clientWidth || 800;
        canvas.height = svgElement.clientHeight || 400;
        const context = canvas.getContext("2d");
        context.fillStyle = theme === "dark" ? "#1d1a17" : "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
        const png = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = "tracker_stats.png";
        link.href = png;
        link.click();
        addNotification("Stats image downloaded.", "success");
      };
      image.src = blobURL;
    } catch (err) {
      console.error(err);
      addNotification("Export failed. Downloading SVG directly.", "info");
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const blobURL = URL.createObjectURL(svgBlob);
      const link = document.createElement("a");
      link.download = "tracker_stats.svg";
      link.href = blobURL;
      link.click();
    }
  };

  // Trigger Weekly review AI chat
  const handleWeeklyReview = async () => {
    if (!chatOpen) {
      setChatOpen(true);
    }
    setAiOpen(true); // Open AI drawer on mobile
    
    const last7DaysTasks = tasks.map((t) => ({
      title: t.title,
      status: t.status,
      category: t.category,
      priority: t.priority,
      timeSpent: t.timeSpent,
      date: format(new Date(t.date), "yyyy-MM-dd"),
    }));

    const summaryContext = `Please analyze my tasks and write a concise Weekly Review Summary. Highlight my achievements, main focus areas, and provide 3 productivity coaching tips for next week. Tasks list:\n${JSON.stringify(last7DaysTasks, null, 2)}`;
    
    await sendAIMessage({
      message: "Analyze my week and write a review summary.",
      context: summaryContext,
    });
  };

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
        <div className="brand-row">
          <button 
            className="mobile-toggle-btn hamburger-btn" 
            type="button" 
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle Navigation Drawer"
          >
            <FiMenu />
          </button>
          <div className="brand">
            <h1>Tracker</h1>
            <span>{pageTitle} for disciplined, visible progress</span>
          </div>
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
              aria-label="Select Date"
            />
          </div>

          <div className="view-toggle">
            <button
              className={`ghost-button ${viewMode === "list" ? "toggle-chip--active" : ""}`}
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <FiList />
              List
            </button>
            <button
              className={`ghost-button ${viewMode === "calendar" ? "toggle-chip--active" : ""}`}
              type="button"
              onClick={() => setViewMode("calendar")}
              aria-label="Calendar view"
            >
              <FiGrid />
              Calendar
            </button>
          </div>

          <button className="button secondary" type="button" onClick={toggleTheme} aria-label="Toggle Dark Mode">
            {theme === "dark" ? <FiSun /> : <FiMoon />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>

          <button className="button secondary" type="button" onClick={() => navigate("/settings")} aria-label="Open Settings">
            <FiSettings />
            Settings
          </button>
        </div>
      </header>

      <div className="workspace-grid">
        {(sidebarOpen || aiOpen) ? (
          <div 
            className="mobile-overlay" 
            onClick={() => {
              setSidebarOpen(false);
              setAiOpen(false);
            }}
            role="presentation"
          />
        ) : null}

        <aside className={`workspace-sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
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
            <div className="sidebar-progress-container">
              <div 
                className="sidebar-progress-bar" 
                style={{ width: `${progress.today?.completionPercentage || 0}%` }}
                aria-label={`${progress.today?.completionPercentage || 0}% completed today`}
              />
            </div>
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
                aria-label="Filter status"
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
                aria-label="Filter category"
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
                aria-label="Filter priority"
              >
                <option value="all">all</option>
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
            </label>
          </div>
        </aside>

        <main 
          className="workspace-main"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
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

        <aside className={`workspace-ai ${aiOpen ? "mobile-open" : ""} ${chatOpen ? "" : "workspace-ai--collapsed"}`}>
          <div className="workspace-ai__toggle">
            <button
              className="ghost-button"
              type="button"
              onClick={() => setChatOpen((prev) => !prev)}
              aria-label="Toggle AI Coach Panel"
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
                  <button className="ghost-button" type="button" onClick={() => refreshCore()} aria-label="Refresh Data">
                    <FiRefreshCw />
                    Refresh data
                  </button>
                  <button className="ghost-button" type="button" onClick={handleWeeklyReview} aria-label="Weekly AI Review">
                    <FiCpu />
                    Weekly review summary
                  </button>
                  <button className="ghost-button" type="button" onClick={handleExportCSV} aria-label="Export to CSV">
                    <FiFileText />
                    Export data to CSV
                  </button>
                  <button className="ghost-button" type="button" onClick={handleDownloadStatsImage} aria-label="Download chart image">
                    <FiDownload />
                    Download stats image
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </aside>
      </div>

      {/* Floating Action Button for AI Chat on Mobile */}
      <button 
        className="mobile-ai-fab" 
        type="button" 
        onClick={() => setAiOpen(prev => !prev)}
        aria-label="Toggle AI Coach"
      >
        <FiMessageSquare />
      </button>

      {/* Modern Toast Stack with Undo */}
      <div className="toast-stack">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`toast toast--${notification.type}`}
            role="status"
          >
            <span>{notification.message}</span>
            <div className="toast-actions">
              {notification.undoAction ? (
                <button
                  className="toast-undo-btn"
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await notification.undoAction();
                    removeNotification(notification.id);
                  }}
                >
                  Undo
                </button>
              ) : null}
              <button
                className="toast-close-btn"
                type="button"
                onClick={() => removeNotification(notification.id)}
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          </div>
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
