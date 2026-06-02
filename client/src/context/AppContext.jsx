/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useReducer, useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import {
  chatWithAI,
  clearAIChat,
  completeTask,
  createTask,
  deleteTask,
  fetchHeatmapData,
  fetchProgressRange,
  fetchStats,
  fetchTasks,
  fetchTodayProgress,
  updateTask,
} from "../services/api";
import {
  loadProgressBackup,
  loadTasksBackup,
  saveProgressBackup,
  saveTasksBackup,
} from "../utils/storage";

const AppContext = createContext(null);

const formatApiDate = (value) => format(new Date(value), "yyyy-MM-dd");
const formatApiMonth = (value) => format(new Date(value), "yyyy-MM");

const createNotification = (message, type = "info", undoAction = null) => ({
  id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  message,
  undoAction,
});

const initialState = {
  tasks: [],
  progress: {
    today: null,
    stats: null,
    heatmap: [],
    trend: [],
    selectedDay: null,
    selectedMonth: formatApiMonth(new Date()),
    heatmapLoaded: false,
    loading: false,
    error: "",
    fromCache: false,
  },
  selectedDate: formatApiDate(new Date()),
  filters: {
    status: "all",
    category: "all",
    priority: "all",
  },
  aiChat: {
    messages: [],
    loading: false,
    error: "",
  },
  notifications: [],
  tasksLoading: false,
  tasksError: "",
  tasksFromCache: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_TASKS":
      return {
        ...state,
        tasks: action.payload.tasks || [],
        tasksLoading: false,
        tasksError: "",
        tasksFromCache: Boolean(action.payload.fromCache),
      };
    case "SET_TASKS_LOADING":
      return {
        ...state,
        tasksLoading: action.payload,
      };
    case "SET_TASKS_ERROR":
      return {
        ...state,
        tasksLoading: false,
        tasksError: action.payload || "",
      };
    case "ADD_TASK":
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task._id === action.payload._id ? action.payload : task
        ),
      };
    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((task) => task._id !== action.payload),
      };
    case "SET_PROGRESS":
      return {
        ...state,
        progress: {
          ...state.progress,
          ...action.payload,
        },
      };
    case "SET_SELECTED_DATE":
      return {
        ...state,
        selectedDate: action.payload,
      };
    case "SET_FILTERS":
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
    case "ADD_AI_MESSAGE":
      return {
        ...state,
        aiChat: {
          ...state.aiChat,
          messages: [...state.aiChat.messages, action.payload],
        },
      };
    case "SET_AI_LOADING":
      return {
        ...state,
        aiChat: {
          ...state.aiChat,
          loading: action.payload,
        },
      };
    case "SET_AI_ERROR":
      return {
        ...state,
        aiChat: {
          ...state.aiChat,
          error: action.payload || "",
        },
      };
    case "CLEAR_CHAT":
      return {
        ...state,
        aiChat: {
          ...state.aiChat,
          messages: [],
          error: "",
          loading: false,
        },
      };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((note) => note.id !== action.payload),
      };
    default:
      return state;
  }
};

const fallbackMessage =
  "The AI service is unavailable right now. Keep moving with one small next task and try again shortly.";

const friendlyError = (err, fallback) => err?.message || fallback;

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const addNotification = useCallback((message, type = "info", undoAction = null) => {
    const notification = createNotification(message, type, undoAction);
    dispatch({ type: "ADD_NOTIFICATION", payload: notification });
    return notification.id;
  }, []);

  const removeNotification = useCallback((id) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  }, []);

  const buildTaskParams = useCallback(
    (overrides = {}) => {
      const selectedDate = overrides.selectedDate || state.selectedDate;
      const filters = overrides.filters || state.filters;
      return { selectedDate, filters };
    },
    [state.filters, state.selectedDate]
  );

  const applyTasksResult = useCallback(
    (tasks, fromCache = false) => {
      dispatch({ type: "SET_TASKS", payload: { tasks, fromCache } });
      if (!fromCache && tasks.length >= 0) {
        saveTasksBackup(tasks, { date: state.selectedDate, filters: state.filters });
      }
    },
    [state.filters, state.selectedDate]
  );

  const loadTasks = useCallback(
    async (options = {}) => {
      const { selectedDate, filters } = buildTaskParams(options);
      dispatch({ type: "SET_TASKS_LOADING", payload: true });
      dispatch({ type: "SET_TASKS_ERROR", payload: "" });

      try {
        const response = await fetchTasks(selectedDate, filters);
        const tasks = response?.tasks || [];
        applyTasksResult(tasks, false);
        return tasks;
      } catch (err) {
        const backup = loadTasksBackup();
        if (backup.length) {
          applyTasksResult(backup, true);
          addNotification("Showing saved tasks while the server is unavailable.", "error");
          return backup;
        }
        const message = friendlyError(err, "Failed to load tasks.");
        dispatch({ type: "SET_TASKS_ERROR", payload: message });
        addNotification(message, "error");
        return [];
      }
    },
    [addNotification, applyTasksResult, buildTaskParams]
  );

  const loadStats = useCallback(async () => {
    dispatch({ type: "SET_PROGRESS", payload: { loading: true, error: "" } });

    try {
      const [todayData, statsData] = await Promise.all([fetchTodayProgress(), fetchStats()]);
      saveProgressBackup({ today: todayData, stats: statsData });
      dispatch({
        type: "SET_PROGRESS",
        payload: {
          today: todayData,
          stats: statsData,
          loading: false,
          error: "",
          fromCache: false,
        },
      });
    } catch (err) {
      const backup = loadProgressBackup();
      if (backup?.today || backup?.stats) {
        dispatch({
          type: "SET_PROGRESS",
          payload: {
            today: backup.today || state.progress.today,
            stats: backup.stats || state.progress.stats,
            loading: false,
            error: "",
            fromCache: true,
          },
        });
        addNotification("Showing saved stats while the server is unavailable.", "error");
        return;
      }
      const message = friendlyError(err, "Failed to load stats.");
      dispatch({ type: "SET_PROGRESS", payload: { loading: false, error: message } });
      addNotification(message, "error");
    }
  }, [addNotification, state.progress.today, state.progress.stats]);

  const loadHeatmap = useCallback(
    async (options = {}) => {
      const monthDate = options.monthDate
        ? new Date(options.monthDate)
        : new Date(`${state.progress.selectedMonth}-01`);

      try {
        const heatmapData = await fetchHeatmapData(formatApiMonth(monthDate));
        dispatch({
          type: "SET_PROGRESS",
          payload: {
            heatmap: heatmapData || [],
            selectedMonth: formatApiMonth(monthDate),
            heatmapLoaded: true,
            error: "",
          },
        });
      } catch (err) {
        const message = friendlyError(err, "Failed to load heatmap.");
        dispatch({ type: "SET_PROGRESS", payload: { error: message } });
        addNotification(message, "error");
      }
    },
    [addNotification, state.progress.selectedMonth]
  );

  const loadTrend = useCallback(async () => {
    const rangeEnd = new Date();
    const rangeStart = subDays(rangeEnd, 29);

    try {
      const trendData = await fetchProgressRange(
        formatApiDate(rangeStart),
        formatApiDate(rangeEnd)
      );
      dispatch({
        type: "SET_PROGRESS",
        payload: { trend: trendData?.progress || [], error: "" },
      });
    } catch (err) {
      const message = friendlyError(err, "Failed to load progress trend.");
      dispatch({ type: "SET_PROGRESS", payload: { error: message } });
      addNotification(message, "error");
    }
  }, [addNotification]);

  const loadProgress = useCallback(
    async (options = {}) => {
      const monthDate = options.monthDate
        ? new Date(options.monthDate)
        : new Date(`${state.progress.selectedMonth}-01`);
      const targetDate = options.selectedDate
        ? new Date(options.selectedDate)
        : new Date(state.selectedDate);

      dispatch({ type: "SET_PROGRESS", payload: { loading: true, error: "" } });

      try {
        const [todayData, statsData, heatmapData, trendData, selectedDayData] = await Promise.all([
          fetchTodayProgress(),
          fetchStats(),
          fetchHeatmapData(formatApiMonth(monthDate)),
          fetchProgressRange(
            formatApiDate(subDays(new Date(), 29)),
            formatApiDate(new Date())
          ),
          fetchProgressRange(formatApiDate(targetDate), formatApiDate(targetDate)),
        ]);

        saveProgressBackup({
          today: todayData,
          stats: statsData,
          heatmap: heatmapData,
          trend: trendData?.progress,
        });

        dispatch({
          type: "SET_PROGRESS",
          payload: {
            today: todayData,
            stats: statsData,
            heatmap: heatmapData || [],
            trend: trendData?.progress || [],
            selectedDay: selectedDayData?.progress?.[0] || null,
            selectedMonth: formatApiMonth(monthDate),
            heatmapLoaded: true,
            loading: false,
            error: "",
            fromCache: false,
          },
        });
      } catch (err) {
        const backup = loadProgressBackup();
        if (backup) {
          dispatch({
            type: "SET_PROGRESS",
            payload: {
              today: backup.today ?? state.progress.today,
              stats: backup.stats ?? state.progress.stats,
              heatmap: backup.heatmap ?? state.progress.heatmap,
              trend: backup.trend ?? state.progress.trend,
              loading: false,
              fromCache: true,
              error: "",
            },
          });
          addNotification("Showing saved progress while the server is unavailable.", "error");
          return;
        }
        const message = friendlyError(err, "Failed to load progress.");
        dispatch({ type: "SET_PROGRESS", payload: { loading: false, error: message } });
        addNotification(message, "error");
      }
    },
    [addNotification, state.progress.heatmap, state.progress.stats, state.progress.today, state.progress.trend, state.progress.selectedMonth, state.selectedDate]
  );

  const loadInitialData = useCallback(
    async (options = {}) => {
      const date = options.selectedDate || state.selectedDate;
      await Promise.all([loadTasks({ selectedDate: date, filters: options.filters }), loadStats()]);
    },
    [loadStats, loadTasks, state.selectedDate]
  );

  const refreshCore = useCallback(
    async (options = {}) => {
      await Promise.all([
        loadTasks({ selectedDate: options.selectedDate, filters: options.filters }),
        loadStats(),
      ]);
      if (state.progress.heatmapLoaded) {
        await loadHeatmap({ monthDate: options.monthDate });
      }
    },
    [loadHeatmap, loadStats, loadTasks, state.progress.heatmapLoaded]
  );

  const refreshAll = useCallback(
    async (options = {}) => {
      await refreshCore(options);
      if (options.includeTrend) {
        await loadTrend();
      }
    },
    [loadTrend, refreshCore]
  );

  const handleAddTask = useCallback(
    async (payload) => {
      try {
        const task = await createTask(payload);
        dispatch({ type: "ADD_TASK", payload: task });
        addNotification("Task added.", "success");
        await refreshCore({ selectedDate: state.selectedDate });
        return task;
      } catch (err) {
        const message = friendlyError(err, "Failed to add task.");
        addNotification(message, "error");
        throw err;
      }
    },
    [addNotification, refreshCore, state.selectedDate]
  );

  const handleUpdateTask = useCallback(
    async (id, payload) => {
      try {
        const updated = await updateTask(id, payload);
        dispatch({ type: "UPDATE_TASK", payload: updated });
        addNotification("Task updated.", "success");
        await refreshCore({ selectedDate: state.selectedDate });
        return updated;
      } catch (err) {
        const message = friendlyError(err, "Failed to update task.");
        addNotification(message, "error");
        throw err;
      }
    },
    [addNotification, refreshCore, state.selectedDate]
  );

  const handleDeleteTask = useCallback(
    async (id) => {
      try {
        const taskToDelete = state.tasks.find((t) => t._id === id);
        await deleteTask(id);
        dispatch({ type: "DELETE_TASK", payload: id });
        
        const undoAction = async () => {
          if (taskToDelete) {
            const restored = await createTask({
              title: taskToDelete.title,
              description: taskToDelete.description,
              category: taskToDelete.category,
              priority: taskToDelete.priority,
              date: taskToDelete.date,
              status: taskToDelete.status,
              timeSpent: taskToDelete.timeSpent,
              aiInsight: taskToDelete.aiInsight,
            });
            dispatch({ type: "ADD_TASK", payload: restored });
            addNotification("Task restored.", "success");
            await refreshCore({ selectedDate: state.selectedDate });
          }
        };

        addNotification("Task deleted.", "info", undoAction);
        await refreshCore({ selectedDate: state.selectedDate });
      } catch (err) {
        const message = friendlyError(err, "Failed to delete task.");
        addNotification(message, "error");
        throw err;
      }
    },
    [addNotification, refreshCore, state.selectedDate, state.tasks]
  );

  const handleToggleComplete = useCallback(
    async (task) => {
      if (!task?._id) {
        return null;
      }

      const originalStatus = task.status;
      const originalTimeSpent = task.timeSpent;

      try {
        const updated =
          task.status === "completed"
            ? await updateTask(task._id, { status: "pending" })
            : await completeTask(task._id, {});

        dispatch({ type: "UPDATE_TASK", payload: updated });

        const undoAction = async () => {
          const rolledBack = originalStatus === "completed"
            ? await completeTask(task._id, { timeSpent: originalTimeSpent })
            : await updateTask(task._id, { status: originalStatus });
          dispatch({ type: "UPDATE_TASK", payload: rolledBack });
          addNotification("Task completion undone.", "success");
          await refreshCore({ selectedDate: state.selectedDate });
        };

        addNotification(
          updated.status === "completed" ? "Task completed." : "Task moved back to pending.",
          "success",
          undoAction
        );
        await refreshCore({ selectedDate: state.selectedDate });
        return updated;
      } catch (err) {
        const message = friendlyError(err, "Failed to update task status.");
        addNotification(message, "error");
        throw err;
      }
    },
    [addNotification, refreshCore, state.selectedDate]
  );

  const handleBulkDelete = useCallback(
    async (ids) => {
      if (!Array.isArray(ids) || ids.length === 0) return;
      try {
        const tasksToDelete = state.tasks.filter((t) => ids.includes(t._id || t.taskId));
        await Promise.all(ids.map((id) => deleteTask(id)));
        
        ids.forEach((id) => {
          dispatch({ type: "DELETE_TASK", payload: id });
        });

        const undoAction = async () => {
          const restoredList = await Promise.all(
            tasksToDelete.map((t) =>
              createTask({
                title: t.title,
                description: t.description,
                category: t.category,
                priority: t.priority,
                date: t.date,
                status: t.status,
                timeSpent: t.timeSpent,
                aiInsight: t.aiInsight,
              })
            )
          );
          restoredList.forEach((restored) => {
            dispatch({ type: "ADD_TASK", payload: restored });
          });
          addNotification(`${restoredList.length} tasks restored.`, "success");
          await refreshCore({ selectedDate: state.selectedDate });
        };

        addNotification(`${ids.length} tasks deleted.`, "info", undoAction);
        await refreshCore({ selectedDate: state.selectedDate });
      } catch (err) {
        const message = friendlyError(err, "Failed to delete multiple tasks.");
        addNotification(message, "error");
      }
    },
    [addNotification, refreshCore, state.selectedDate, state.tasks]
  );

  const handleBulkComplete = useCallback(
    async (ids) => {
      if (!Array.isArray(ids) || ids.length === 0) return;
      try {
        const tasksToComplete = state.tasks.filter(
          (t) => ids.includes(t._id || t.taskId) && t.status !== "completed"
        );
        
        if (tasksToComplete.length === 0) {
          addNotification("Selected tasks are already completed.", "info");
          return;
        }

        const updatedTasks = await Promise.all(
          tasksToComplete.map((t) => completeTask(t._id || t.taskId, {}))
        );

        updatedTasks.forEach((updated) => {
          dispatch({ type: "UPDATE_TASK", payload: updated });
        });

        const undoAction = async () => {
          const rolledBackList = await Promise.all(
            updatedTasks.map((t) =>
              updateTask(t._id || t.taskId, { status: "pending" })
            )
          );
          rolledBackList.forEach((rolledBack) => {
            dispatch({ type: "UPDATE_TASK", payload: rolledBack });
          });
          addNotification("Bulk completion undone.", "success");
          await refreshCore({ selectedDate: state.selectedDate });
        };

        addNotification(`${updatedTasks.length} tasks marked completed.`, "success", undoAction);
        await refreshCore({ selectedDate: state.selectedDate });
      } catch (err) {
        const message = friendlyError(err, "Failed to complete multiple tasks.");
        addNotification(message, "error");
      }
    },
    [addNotification, refreshCore, state.selectedDate, state.tasks]
  );

  const setSelectedDate = useCallback(
    async (dateValue) => {
      dispatch({ type: "SET_SELECTED_DATE", payload: dateValue });
      await refreshCore({ selectedDate: dateValue });
    },
    [refreshCore]
  );

  const setFilters = useCallback(
    async (nextFilters) => {
      const merged = { ...state.filters, ...nextFilters };
      dispatch({ type: "SET_FILTERS", payload: nextFilters });
      await loadTasks({ filters: merged });
    },
    [loadTasks, state.filters]
  );

  const setProgress = useCallback((payload) => {
    dispatch({ type: "SET_PROGRESS", payload });
  }, []);

  const loadSelectedDay = useCallback(
    async (dateValue) => {
      try {
        const response = await fetchProgressRange(
          formatApiDate(dateValue),
          formatApiDate(dateValue)
        );
        const selectedDay = response?.progress?.[0] || null;
        dispatch({ type: "SET_PROGRESS", payload: { selectedDay } });
        return selectedDay;
      } catch (err) {
        const message = friendlyError(err, "Failed to load selected day.");
        dispatch({ type: "SET_PROGRESS", payload: { error: message } });
        addNotification(message, "error");
        return null;
      }
    },
    [addNotification]
  );

  const loadProgressMonth = useCallback(
    async (monthDate) => {
      await loadHeatmap({ monthDate });
    },
    [loadHeatmap]
  );

  const loadAnalyticsData = useCallback(
    async (options = {}) => {
      dispatch({ type: "SET_PROGRESS", payload: { loading: true, error: "" } });
      await Promise.all([
        loadHeatmap(options),
        loadTrend(),
        loadStats(),
        loadSelectedDay(options.selectedDate || state.selectedDate),
      ]);
      dispatch({ type: "SET_PROGRESS", payload: { loading: false } });
    },
    [loadHeatmap, loadSelectedDay, loadStats, loadTrend, state.selectedDate]
  );

  const sendAIMessage = useCallback(
    async ({ message, context }) => {
      const trimmed = String(message || "").trim();
      if (!trimmed) {
        return null;
      }

      const userEntry = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_AI_MESSAGE", payload: userEntry });
      dispatch({ type: "SET_AI_LOADING", payload: true });
      dispatch({ type: "SET_AI_ERROR", payload: "" });

      try {
        const response = await chatWithAI({ message: trimmed, context });
        const assistantEntry = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response?.response || fallbackMessage,
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: "ADD_AI_MESSAGE", payload: assistantEntry });
        return assistantEntry;
      } catch (err) {
        const messageText = friendlyError(err, fallbackMessage);
        dispatch({ type: "SET_AI_ERROR", payload: messageText });
        const fallbackEntry = {
          id: `assistant-fallback-${Date.now()}`,
          role: "assistant",
          content: fallbackMessage,
          createdAt: new Date().toISOString(),
          isFallback: true,
        };
        dispatch({ type: "ADD_AI_MESSAGE", payload: fallbackEntry });
        addNotification(messageText, "error");
        return fallbackEntry;
      } finally {
        dispatch({ type: "SET_AI_LOADING", payload: false });
      }
    },
    [addNotification]
  );

  const clearChat = useCallback(async () => {
    dispatch({ type: "CLEAR_CHAT" });
    try {
      await clearAIChat();
    } catch (err) {
      const message = friendlyError(err, "Unable to clear AI chat history.");
      dispatch({ type: "SET_AI_ERROR", payload: message });
      addNotification(message, "error");
    }
  }, [addNotification]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      addTask: handleAddTask,
      updateTask: handleUpdateTask,
      deleteTask: handleDeleteTask,
      toggleComplete: handleToggleComplete,
      bulkDelete: handleBulkDelete,
      bulkComplete: handleBulkComplete,
      theme,
      toggleTheme,
      loadTasks,
      loadStats,
      loadHeatmap,
      loadTrend,
      loadProgress,
      loadInitialData,
      loadAnalyticsData,
      loadSelectedDay,
      loadProgressMonth,
      refreshCore,
      refreshAll,
      setSelectedDate,
      setFilters,
      setProgress,
      sendAIMessage,
      clearChat,
      addNotification,
      removeNotification,
    }),
    [
      addNotification,
      clearChat,
      handleAddTask,
      handleDeleteTask,
      handleToggleComplete,
      handleBulkDelete,
      handleBulkComplete,
      theme,
      toggleTheme,
      handleUpdateTask,
      loadAnalyticsData,
      loadHeatmap,
      loadInitialData,
      loadProgress,
      loadProgressMonth,
      loadSelectedDay,
      loadStats,
      loadTasks,
      loadTrend,
      refreshAll,
      refreshCore,
      removeNotification,
      sendAIMessage,
      setFilters,
      setProgress,
      setSelectedDate,
      state,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContextState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContextState must be used within AppProvider");
  }
  return context;
};
