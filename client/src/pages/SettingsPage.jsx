const SettingsPage = () => (
  <div className="section">
    <div>
      <h2 className="page-title">Settings</h2>
      <p className="page-subtitle">A simple control room for how you want the app to feel.</p>
    </div>

    <div className="grid">
      <div className="card">
        <h3>Workspace</h3>
        <p className="meta">Calendar-first planning and AI chat are currently enabled.</p>
      </div>
      <div className="card">
        <h3>Notifications</h3>
        <p className="meta">Toasts appear for task updates, AI failures, and refresh errors.</p>
      </div>
      <div className="card">
        <h3>Feedback</h3>
        <p className="meta">Use the footer feedback link to share what should improve next.</p>
      </div>
    </div>
  </div>
);

export default SettingsPage;
