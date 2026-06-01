/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import { format, subDays } from "date-fns";
import {
  chatWithAI,
  clearAIChat,
  createTask,
  deleteTask,
  getHeatmapData,
  getProgressRange,
  getStats,
  getTasks,
  getTodayProgress,
  markTaskComplete,
  updateTask,
} from "../services/api";

const AppContext = createContext(null);

const formatApiDate = (value) => format(new Date(value), "yyyy-MM-dd");
const formatApiMonth = (value) => format(new Date(value), "yyyy-MM");

const createNotification = (message, type = "info") => ({
  id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  message,
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
    loading: false,
    error: "",
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
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_TASKS":
      return {
        ...state,
        tasks: action.payload || [],
        tasksLoading: false,
        tasksError: "",
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

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addNotification = useCallback((message, type = "info") => {
    const notification = createNotification(message, type);
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
      const params = {
        page: 1,
        limit: overrides.limit || 20,
      };

      if (selectedDate && overrides.includeDate !== false) {
        params.date = selectedDate;
      }
      if (filters.status && filters.status !== "all") {
        params.status = filters.status;
      }
      if (filters.category && filters.category !== "all") {
        params.category = filters.category;
      }

      return params;
    },
    [state.filters, state.selectedDate]
  );

  const loadTasks = useCallback(
    async (options = {}) => {
      dispatch({ type: "SET_TASKS_LOADING", payload: true });
      dispatch({ type: "SET_TASKS_ERROR", payload: "" });

      try {
        const response = await getTasks(buildTaskParams(options));
        let tasks = response?.tasks || [];
        const activeFilters = options.filters || state.filters;

        if (activeFilters.priority && activeFilters.priority !== "all") {
          tasks = tasks.filter((task) => task.priority === activeFilters.priority);
        }

        dispatch({ type: "SET_TASKS", payload: tasks });
        return tasks;
      } catch (err) {
        const message = err.message || "Failed to load tasks.";
        dispatch({ type: "SET_TASKS_ERROR", payload: message });
        addNotification(message, "error");
        return [];
      }
    },
    [addNotification, buildTaskParams, state.filters]
  );

  const loadProgress = useCallback(
    async (options = {}) => {
      const monthDate = options.monthDate
        ? new Date(options.monthDate)
        : new Date(`${state.progress.selectedMonth}-01`);
      const targetDate = options.selectedDate
        ? new Date(options.selectedDate)
        : new Date(state.selectedDate);
      const rangeEnd = new Date();
      const rangeStart = subDays(rangeEnd, 29);

      dispatch({
        type: "SET_PROGRESS",
        payload: { loading: true, error: "" },
      });

      try {
        const [todayData, statsData, heatmapData, trendData, selectedDayData] = await Promise.all([
          getTodayProgress(),
          getStats(),
          getHeatmapData({ month: formatApiMonth(monthDate) }),
          getProgressRange({
            startDate: formatApiDate(rangeStart),
            endDate: formatApiDate(rangeEnd),
          }),
          getProgressRange({
            startDate: formatApiDate(targetDate),
            endDate: formatApiDate(targetDate),
          }),
        ]);

        dispatch({
          type: "SET_PROGRESS",
          payload: {
            today: todayData,
            stats: statsData,
            heatmap: heatmapData || [],
            trend: trendData?.progress || [],
            selectedDay: selectedDayData?.progress?.[0] || null,
            selectedMonth: formatApiMonth(monthDate),
            loading: false,
            error: "",
          },
        });
      } catch (err) {
        const message = err.message || "Failed to load progress.";
        dispatch({
          type: "SET_PROGRESS",
          payload: { loading: false, error: message },
        });
        addNotification(message, "error");
      }
    },
    [addNotification, state.progress.selectedMonth, state.selectedDate]
  );

  const refreshAll = useCallback(
    async (options = {}) => {
      await Promise.all([
        loadTasks({ selectedDate: options.selectedDate, filters: options.filters, limit: options.limit }),
        loadProgress({ selectedDate: options.selectedDate, monthDate: options.monthDate }),
      ]);
    },
    [loadProgress, loadTasks]
  );

  const handleAddTask = useCallback(
    async (payload) => {
      const task = await createTask(payload);
      dispatch({ type: "ADD_TASK", payload: task });
      addNotification("Task added.", "success");
      await refreshAll({ selectedDate: state.selectedDate });
      return task;
    },
    [addNotification, refreshAll, state.selectedDate]
  );

  const handleUpdateTask = useCallback(
    async (id, payload) => {
      const updated = await updateTask(id, payload);
      dispatch({ type: "UPDATE_TASK", payload: updated });
      addNotification("Task updated.", "success");
      await refreshAll({ selectedDate: state.selectedDate });
      return updated;
    },
    [addNotification, refreshAll, state.selectedDate]
  );

  const handleDeleteTask = useCallback(
    async (id) => {
      await deleteTask(id);
      dispatch({ type: "DELETE_TASK", payload: id });
      addNotification("Task deleted.", "info");
      await refreshAll({ selectedDate: state.selectedDate });
    },
    [addNotification, refreshAll, state.selectedDate]
  );

  const handleToggleComplete = useCallback(
    async (task) => {
      if (!task?._id) {
        return null;
      }

      const updated =
        task.status === "completed"
          ? await updateTask(task._id, { status: "pending" })
          : await markTaskComplete(task._id, {});

      dispatch({ type: "UPDATE_TASK", payload: updated });
      addNotification(
        updated.status === "completed" ? "Task completed." : "Task moved back to pending.",
        "success"
      );
      await refreshAll({ selectedDate: state.selectedDate });
      return updated;
    },
    [addNotification, refreshAll, state.selectedDate]
  );

  const setSelectedDate = useCallback(
    async (dateValue) => {
      dispatch({ type: "SET_SELECTED_DATE", payload: dateValue });
      await refreshAll({ selectedDate: dateValue });
    },
    [refreshAll]
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
        const response = await getProgressRange({
          startDate: formatApiDate(dateValue),
          endDate: formatApiDate(dateValue),
        });

        const selectedDay = response?.progress?.[0] || null;
        dispatch({ type: "SET_PROGRESS", payload: { selectedDay } });
        return selectedDay;
      } catch (err) {
        const message = err.message || "Failed to load selected day.";
        dispatch({ type: "SET_PROGRESS", payload: { error: message } });
        addNotification(message, "error");
        return null;
      }
    },
    [addNotification]
  );

  const loadProgressMonth = useCallback(
    async (monthDate) => {
      await loadProgress({
        monthDate,
        selectedDate: state.progress.selectedDay?.date || state.selectedDate,
      });
    },
    [loadProgress, state.progress.selectedDay?.date, state.selectedDate]
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
        const messageText = err.message || fallbackMessage;
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
      const message = err.message || "Unable to clear AI chat history.";
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
      loadTasks,
      loadProgress,
      loadSelectedDay,
      loadProgressMonth,
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
      handleUpdateTask,
      loadProgress,
      loadProgressMonth,
      loadSelectedDay,
      loadTasks,
      refreshAll,
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
