import { useState } from "react";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import { generateAIInsights } from "../services/api";

const InsightsPage = () => {
  const [date, setDate] = useState("");
  const [context, setContext] = useState("");
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await generateAIInsights({ date, context });
      setInsight(response.generalInsight || "No insight returned.");
    } catch (err) {
      setError(err.message || "Unable to generate insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div>
        <h2 className="page-title">AI Insights</h2>
        <p className="page-subtitle">Turn daily output into next steps.</p>
      </div>

      <form className="card" onSubmit={handleGenerate}>
        <h3>Generate insight</h3>
        <label className="task-meta">
          Date
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label className="task-meta">
          Context (optional)
          <textarea
            rows="3"
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="Any extra context to share"
          />
        </label>
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {loading && <LoadingState label="Contacting AI..." />}
      {error && <ErrorState message={error} />}
      {insight && <div className="card">{insight}</div>}
    </div>
  );
};

export default InsightsPage;
