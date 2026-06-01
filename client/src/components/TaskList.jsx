import { useMemo, useState } from "react";
import TaskItem from "./TaskItem";
import styles from "./TaskList.module.css";
import { formatISODate, shiftDateBy } from "../utils/dateUtils";

const statusOptions = ["all", "pending", "in-progress", "completed"];
const categoryOptions = ["all", "work", "health", "personal", "learning", "other"];
const priorityOptions = ["all", "high", "medium", "low"];
const sortOptions = [
  { value: "date", label: "Date" },
  { value: "priority", label: "Priority" },
  { value: "timeSpent", label: "Time spent" },
];

const TaskList = ({
  tasks,
  loading,
  error,
  onRefresh,
  onToggleComplete,
  onDelete,
  onUpdate,
  showToolbar = true,
  title = "Tasks",
  subtitle = "Filter by what matters most right now.",
  emptyMessage = "No tasks match these filters yet.",
}) => {
  const [dateFilter, setDateFilter] = useState("today");
  const [customDate, setCustomDate] = useState(formatISODate(new Date()));
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filterDate = useMemo(() => {
    if (dateFilter === "today") {
      return formatISODate(new Date());
    }
    if (dateFilter === "tomorrow") {
      return formatISODate(shiftDateBy(new Date(), 1));
    }
    if (dateFilter === "custom") {
      return customDate;
    }
    return "";
  }, [dateFilter, customDate]);

  const handleRefresh = () => {
    if (!onRefresh) {
      return;
    }

    const params = {};
    if (statusFilter !== "all") {
      params.status = statusFilter;
    }
    if (categoryFilter !== "all") {
      params.category = categoryFilter;
    }

    if (dateFilter !== "all" && filterDate) {
      params.date = filterDate;
    }

    onRefresh(params);
  };

  const filteredTasks = useMemo(() => {
    if (!showToolbar) {
      return Array.isArray(tasks) ? tasks : [];
    }

    let list = Array.isArray(tasks) ? tasks : [];

    if (statusFilter !== "all") {
      list = list.filter((task) => task.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      list = list.filter((task) => task.category === categoryFilter);
    }

    if (filterDate) {
      list = list.filter((task) => {
        if (!task.date) {
          return false;
        }
        return formatISODate(new Date(task.date)) === filterDate;
      });
    }

    if (priorityFilter !== "all") {
      list = list.filter((task) => task.priority === priorityFilter);
    }

    const sorted = [...list].sort((a, b) => {
      if (sortBy === "priority") {
        const order = { high: 3, medium: 2, low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      }
      if (sortBy === "timeSpent") {
        return (b.timeSpent || 0) - (a.timeSpent || 0);
      }
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

    return sorted;
  }, [
    tasks,
    statusFilter,
    categoryFilter,
    filterDate,
    priorityFilter,
    sortBy,
    showToolbar,
  ]);

  return (
    <div className={styles.toolbar}>
      {showToolbar ? (
        <>
          <div className={styles.controls}>
            <div>
              <h3>{title}</h3>
              <p className="page-subtitle">{subtitle}</p>
            </div>
            <button className="button secondary" type="button" onClick={handleRefresh}>
              Refresh
            </button>
          </div>

          <div className={styles.filters}>
            <label className={styles.filterGroup}>
              Date
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="custom">Pick a date</option>
                <option value="all">All</option>
              </select>
            </label>
            {dateFilter === "custom" ? (
              <label className={styles.filterGroup}>
                Selected date
                <input
                  type="date"
                  value={customDate}
                  onChange={(event) => setCustomDate(event.target.value)}
                />
              </label>
            ) : null}
            <label className={styles.filterGroup}>
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {statusOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.filterGroup}>
              Category
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                {categoryOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.filterGroup}>
              Priority
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                {priorityOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${styles.filterGroup} ${styles.sortSelect}`}>
              Sort by
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      ) : (
        <div className={styles.controls}>
          <div className={styles.filterGroup}>
            <span>{title}</span>
            <span className="page-subtitle">{subtitle}</span>
          </div>
          {onRefresh ? (
            <button className="button secondary" type="button" onClick={() => onRefresh({})}>
              Refresh
            </button>
          ) : null}
        </div>
      )}

      {error ? <div className={styles.error}>{error}</div> : null}

      {loading ? (
        <div className={styles.list}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`skeleton-${index}`} className={styles.skeleton} />
          ))}
        </div>
      ) : error ? null : filteredTasks.length === 0 ? (
        <div className={styles.empty}>{emptyMessage}</div>
      ) : (
        <div className={styles.list}>
          {filteredTasks.map((task) => (
            <TaskItem
              key={task._id || task.taskId}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
