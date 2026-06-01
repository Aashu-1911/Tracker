import { Routes, Route } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import Dashboard from "./pages/Dashboard";
import TasksPage from "./pages/TasksPage";
import InsightsPage from "./pages/InsightsPage";
import NotFound from "./pages/NotFound";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
