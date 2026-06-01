import { useState } from "react";
import {
  FiCheckCircle,
  FiEdit3,
  FiTrash2,
  FiArrowUpCircle,
  FiArrowDownCircle,
  FiMinusCircle,
} from "react-icons/fi";
import { formatShortDate } from "../utils/dateUtils";
import styles from "./TaskItem.module.css";
import TaskInsightBadge from "./TaskInsightBadge";
import InsightModal from "./InsightModal";

const priorityIconMap = {
  high: <FiArrowUpCircle />,
  medium: <FiMinusCircle />,
  low: <FiArrowDownCircle />,
};

const getFormStateFromTask = (task) => ({
  description: task.description || "",
  priority: task.priority || "medium",
  status: task.status || "pending",
  timeSpent: task.timeSpent ?? "",
  aiInsight: task.aiInsight || "",
});

const TaskItem = ({ task, onUpdate, onDelete, onToggleComplete }) => {
  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState(() => getFormStateFromTask(task));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [localInsight, setLocalInsight] = useState(task.aiInsight || "");
  const [insightModalOpen, setInsightModalOpen] = useState(false);

  const category = task.category || "other";
  const status = task.status || "pending";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      await onUpdate(task._id, {
        description: formState.description,
        priority: formState.priority,
        status: formState.status,
        timeSpent:
          formState.timeSpent === "" ? undefined : Number(formState.timeSpent),
        aiInsight: formState.aiInsight,
      });
      setEditing(false);
    } catch (err) {
      setError(err.message || "Unable to update task.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) {
      return;
    }

    try {
      await onDelete(task._id);
    } catch (err) {
      setError(err.message || "Unable to delete task.");
    }
  };

  const handleToggleStatus = async () => {
    setError("");

    try {
      await onToggleComplete(task);
    } catch (err) {
      setError(err.message || "Unable to update task status.");
    }
  };

  const handleStartEditing = () => {
    setError("");
    setFormState(getFormStateFromTask(task));
    setEditing(true);
  };

  const handleCancelEditing = () => {
    setFormState(getFormStateFromTask(task));
    setEditing(false);
  };

  const handleInsightReady = (updatedTask, insightText) => {
    const nextInsight = insightText || updatedTask?.aiInsight || "";
    setLocalInsight(nextInsight);
    setFormState((prev) => ({ ...prev, aiInsight: nextInsight }));
    setInsightModalOpen(true);
  };

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h4>{task.title}</h4>
            <span className={`${styles.badge} ${styles[category] || ""}`}>
              {category}
            </span>
          </div>
          <p className={styles.meta}>
            {formatShortDate(task.date)} · {status.replace("-", " ")}
          </p>
        </div>
        <div className={`${styles.status} ${styles[status] || ""}`}>
          {status}
        </div>
      </div>

      {task.timeSpent ? (
        <div className={styles.timeSpent}>Time spent: {task.timeSpent} min</div>
      ) : null}

      {editing ? (
        <div className={styles.editor}>
          <label>
            Description
            <textarea
              name="description"
              rows="3"
              value={formState.description}
              onChange={handleChange}
            />
          </label>
          <div className={styles.row}>
            <label>
              Priority
              <select name="priority" value={formState.priority} onChange={handleChange}>
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" value={formState.status} onChange={handleChange}>
                <option value="pending">pending</option>
                <option value="in-progress">in-progress</option>
                <option value="completed">completed</option>
              </select>
            </label>
            <label>
              Time spent (min)
              <input
                name="timeSpent"
                type="number"
                min="0"
                value={formState.timeSpent}
                onChange={handleChange}
              />
            </label>
          </div>
          <label>
            AI Insight
            <textarea
              name="aiInsight"
              rows="2"
              value={formState.aiInsight}
              onChange={handleChange}
            />
          </label>
          {error ? <div className={styles.error}>{error}</div> : null}
          <div className={styles.actions}>
            <button
              className={styles.primary}
              type="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              className={styles.secondary}
              type="button"
              onClick={handleCancelEditing}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {task.description ? <p className={styles.description}>{task.description}</p> : null}
          <div className={styles.footer}>
            <div className={styles.priority}>
              {priorityIconMap[task.priority || "medium"]}
              <span>{task.priority || "medium"}</span>
            </div>
            <div className={styles.actions}>
              <TaskInsightBadge
                task={{ ...task, aiInsight: localInsight || task.aiInsight }}
                onInsightReady={handleInsightReady}
              />
              <button
                className={styles.ghost}
                type="button"
                onClick={handleToggleStatus}
              >
                <FiCheckCircle />
                {status === "completed" ? "Mark pending" : "Complete"}
              </button>
              <button
                className={styles.ghost}
                type="button"
                onClick={handleStartEditing}
              >
                <FiEdit3 />
                Edit
              </button>
              <button className={styles.ghost} type="button" onClick={handleDelete}>
                <FiTrash2 />
                Delete
              </button>
              {localInsight ? (
                <button
                  className={styles.ghost}
                  type="button"
                  onClick={() => setInsightModalOpen(true)}
                >
                  View insight
                </button>
              ) : null}
            </div>
          </div>
          {error ? <div className={styles.error}>{error}</div> : null}
        </>
      )}
      <InsightModal
        isOpen={insightModalOpen}
        title={`Insight for ${task.title}`}
        insight={localInsight || task.aiInsight}
        onClose={() => setInsightModalOpen(false)}
      />
    </article>
  );
};

export default TaskItem;
