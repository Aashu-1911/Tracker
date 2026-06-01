import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { FiZap } from "react-icons/fi";
import { generateAIInsights } from "../services/api";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import InsightModal from "./InsightModal";
import MarkdownContent from "./MarkdownContent";

const formatInputDate = (value) => format(new Date(value), "yyyy-MM-dd");

const extractSections = (text) => {
  const raw = String(text || "");
  const parts = raw.split(/\n\s*\n/).filter(Boolean);
  return {
    motivational: parts[0] || "You are building momentum one task at a time.",
    patterns: parts[1] || "Patterns will appear here once insights are generated.",
    suggestions: parts[2] || "Suggestions for improvement will appear here.",
    category: parts.slice(3).join("\n\n") || "Category-specific insights will appear here.",
  };
};

const AIInsights = ({ onInsightsApplied }) => {
  const [mode, setMode] = useState("today");
  const [date, setDate] = useState(formatInputDate(new Date()));
  const [startDate, setStartDate] = useState(formatInputDate(subDays(new Date(), 6)));
  const [endDate, setEndDate] = useState(formatInputDate(new Date()));
  const [context, setContext] = useState("");
  const [insight, setInsight] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const sections = useMemo(() => extractSections(insight), [insight]);

  const buildPayload = () => {
    if (mode === "range") {
      return { startDate, endDate, context };
    }
    return { date, context };
  };

  const handleGenerate = async (event) => {
    event?.preventDefault?.();
    setLoading(true);
    setError("");

    try {
      const response = await generateAIInsights(buildPayload());
      setInsight(response?.generalInsight || "");
      setTasks(response?.tasks || []);
      onInsightsApplied?.(response?.tasks || []);
      setModalOpen(true);
    } catch (err) {
      setError(err.message || "Unable to generate insights.");
      setInsight("");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="card ai-insights-card">
        <div className="viz-card__header">
          <div>
            <h3>AI insights</h3>
            <p className="meta">Generate reflections for today or a custom date range.</p>
          </div>
        </div>

        <form className="ai-insights-form" onSubmit={handleGenerate}>
          <div className="mode-toggle">
            <button
              className={`toggle-chip ${mode === "today" ? "toggle-chip--active" : ""}`}
              type="button"
              onClick={() => setMode("today")}
            >
              Insights for today
            </button>
            <button
              className={`toggle-chip ${mode === "range" ? "toggle-chip--active" : ""}`}
              type="button"
              onClick={() => setMode("range")}
            >
              Select date range
            </button>
          </div>

          {mode === "today" ? (
            <label className="task-meta">
              Date
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
          ) : (
            <div className="inline-fields">
              <label className="task-meta">
                Start
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <label className="task-meta">
                End
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </div>
          )}

          <label className="task-meta">
            Context
            <textarea
              rows="3"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Share anything the AI should factor in."
            />
          </label>

          <button className="button" type="submit" disabled={loading}>
            <FiZap />
            {loading ? "Generating..." : "Generate insights"}
          </button>
        </form>

        {loading ? <LoadingState label="Thinking through your progress..." /> : null}
        {error ? <ErrorState message={error} /> : null}

        {insight ? (
          <div className="ai-insight-preview-grid">
            <div className="mini-insight-card">
              <h4>Motivational message</h4>
              <MarkdownContent content={sections.motivational} className="markdown-content" />
            </div>
            <div className="mini-insight-card">
              <h4>Patterns</h4>
              <MarkdownContent content={sections.patterns} className="markdown-content" />
            </div>
            <div className="mini-insight-card">
              <h4>Suggestions</h4>
              <MarkdownContent content={sections.suggestions} className="markdown-content" />
            </div>
            <div className="mini-insight-card">
              <h4>Category insights</h4>
              <MarkdownContent content={sections.category} className="markdown-content" />
            </div>
          </div>
        ) : null}

        {tasks.length > 0 ? (
          <div className="task-insights-list">
            <h4>Task insights available</h4>
            <div className="task-insights-list__items">
              {tasks.map((task) => (
                <button
                  key={task._id || task.taskId}
                  type="button"
                  className="prompt-chip"
                  onClick={() => {
                    setInsight(task.aiInsight || insight);
                    setModalOpen(true);
                  }}
                >
                  {task.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <InsightModal
        isOpen={modalOpen}
        title="AI productivity insight"
        insight={insight}
        loading={loading}
        canRegenerate
        onClose={() => setModalOpen(false)}
        onRegenerate={handleGenerate}
      />
    </>
  );
};

export default AIInsights;
