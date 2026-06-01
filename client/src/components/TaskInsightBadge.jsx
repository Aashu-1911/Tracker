import { useState } from "react";
import { FiCpu, FiRefreshCcw } from "react-icons/fi";
import { generateInsights } from "../services/api";

const TaskInsightBadge = ({ task, onInsightReady }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const preview = task?.aiInsight
    ? `${String(task.aiInsight).slice(0, 80)}${String(task.aiInsight).length > 80 ? "..." : ""}`
    : "Generate an AI insight for this task.";

  const handleClick = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await generateInsights({ taskIds: [task._id] });
      const updatedTask = response?.tasks?.[0] || task;
      onInsightReady?.(updatedTask, response?.generalInsight || updatedTask.aiInsight || "");
    } catch (err) {
      setError(err.message || "Unable to generate task insight.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-insight-badge-wrap" title={error || preview}>
      <button
        className={`task-insight-badge ${task?.aiInsight ? "task-insight-badge--ready" : ""}`}
        type="button"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? <FiRefreshCcw className="spin" /> : <FiCpu />}
        {task?.aiInsight ? "Insight ready" : "Get insight"}
      </button>
    </div>
  );
};

export default TaskInsightBadge;
