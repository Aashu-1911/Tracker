import { useEffect } from "react";
import AIInsights from "../components/AIInsights";
import AIChat from "../components/AIChat";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import useTasks from "../hooks/useTasks";

const InsightsPage = () => {
  const { tasks, loading, error, fetchTasks } = useTasks();

  useEffect(() => {
    fetchTasks({ page: 1, limit: 12 });
  }, [fetchTasks]);

  return (
    <div className="section">
      <div>
        <h2 className="page-title">AI Insights</h2>
        <p className="page-subtitle">Turn daily output into next steps.</p>
      </div>

      {loading ? <LoadingState label="Loading recent tasks for AI context..." /> : null}
      {error ? <ErrorState message={error} /> : null}

      <div className="ai-page-grid">
        <AIInsights onInsightsApplied={() => fetchTasks({ page: 1, limit: 12 })} />
        <AIChat contextTasks={tasks} />
      </div>
    </div>
  );
};

export default InsightsPage;
