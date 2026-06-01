import { NavLink } from "react-router-dom";
import { FiHome, FiCheckSquare, FiCpu } from "react-icons/fi";

const AppHeader = () => (
  <header className="app-header">
    <div className="brand">
      <h1>Tracker</h1>
      <span>Daily focus with momentum</span>
    </div>
    <nav className="nav-links">
      <NavLink className="nav-link" to="/">
        <FiHome size={16} />
        Dashboard
      </NavLink>
      <NavLink className="nav-link" to="/tasks">
        <FiCheckSquare size={16} />
        Tasks
      </NavLink>
      <NavLink className="nav-link" to="/insights">
        <FiCpu size={16} />
        Insights
      </NavLink>
    </nav>
  </header>
);

export default AppHeader;
