import { Component } from "react";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Something unexpected happened.",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI error boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card">
          <h3>Something went off track</h3>
          <p className="meta">{this.state.message}</p>
          <button
            className="button"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
