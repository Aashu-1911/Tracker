import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://takeyouforward-6se6.onrender.com/";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const normalizeApiError = (error) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";
  const status = error?.response?.status || null;
  console.error("[API]", { message, status, url: error?.config?.url });
  return { ok: false, error: message, status, data: null };
};

const shouldRetry = (error, attempt, maxRetries) => {
  if (attempt >= maxRetries) {
    return false;
  }
  if (!error?.response) {
    return true;
  }
  return RETRYABLE_STATUSES.has(error.response.status);
};

export const requestWithRetry = async (executor, options = {}) => {
  const maxRetries = options.retries ?? MAX_RETRIES;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const data = await executor();
      return { ok: true, data, error: null, status: 200 };
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error, attempt, maxRetries)) {
        break;
      }
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  return normalizeApiError(lastError);
};

const unwrap = async (executor) => {
  const result = await requestWithRetry(executor);
  if (!result.ok) {
    const err = new Error(result.error);
    err.status = result.status;
    throw err;
  }
  return result.data;
};

const buildTaskParams = (date, filters = {}, pagination = {}) => {
  const params = {
    page: pagination.page || 1,
    limit: pagination.limit || 100,
  };

  if (date) {
    params.date = date;
  }
  if (filters.status && filters.status !== "all") {
    params.status = filters.status;
  }
  if (filters.category && filters.category !== "all") {
    params.category = filters.category;
  }

  return params;
};

const applyClientFilters = (tasks, filters = {}) => {
  let result = Array.isArray(tasks) ? tasks : [];
  if (filters.priority && filters.priority !== "all") {
    result = result.filter((task) => task.priority === filters.priority);
  }
  return result;
};

// ——— Tasks ———

export const fetchTasks = async (date, filters = {}, pagination = {}) => {
  const response = await unwrap(() =>
    api.get("/tasks", { params: buildTaskParams(date, filters, pagination) }).then((r) => r.data)
  );
  const tasks = applyClientFilters(response?.tasks || [], filters);
  return { ...response, tasks, count: tasks.length };
};

export const createTask = (taskData) =>
  unwrap(() => api.post("/tasks", taskData).then((r) => r.data));

export const updateTask = (taskId, updates) =>
  unwrap(() => api.put(`/tasks/${taskId}`, updates).then((r) => r.data));

export const deleteTask = (taskId) =>
  unwrap(() => api.delete(`/tasks/${taskId}`).then((r) => r.data));

export const completeTask = (taskId, payload = {}) =>
  unwrap(() => api.patch(`/tasks/${taskId}/complete`, payload).then((r) => r.data));

export const getTaskById = (id) => unwrap(() => api.get(`/tasks/${id}`).then((r) => r.data));

export const getTasksByDate = (date) =>
  unwrap(() => api.get(`/tasks/date/${date}`).then((r) => r.data));

// ——— Progress ———

export const fetchTodayProgress = () =>
  unwrap(() => api.get("/progress/today").then((r) => r.data));

export const fetchProgressRange = (startDate, endDate) =>
  unwrap(() =>
    api.get("/progress/range", { params: { startDate, endDate } }).then((r) => r.data)
  );

export const fetchStats = () => unwrap(() => api.get("/progress/stats").then((r) => r.data));

export const fetchHeatmapData = (month) =>
  unwrap(() => api.get("/progress/heatmap", { params: { month } }).then((r) => r.data));

export const getWeeklySummary = () =>
  unwrap(() => api.get("/progress/weekly").then((r) => r.data));

export const updateProgress = (payload) =>
  unwrap(() => api.post("/progress/update", payload).then((r) => r.data));

// ——— AI ———

export const generateInsights = (payload) =>
  unwrap(() => api.post("/ai/generate-insights", payload).then((r) => r.data));

export const sendChatMessage = (message, context = []) =>
  unwrap(() =>
    api.post("/ai/chat", { message, context: Array.isArray(context) ? context : [] }).then((r) => r.data)
  );

export const getTodayRecommendation = async (contextTasks = []) => {
  const response = await sendChatMessage(
    "Based on my tasks and progress today, give one short, actionable recommendation for what to focus on next. Reply in 2-3 sentences.",
    contextTasks
  );
  return {
    recommendation: response?.response || "Pick one high-impact task and finish it before starting anything new.",
  };
};

export const clearAIChat = () => unwrap(() => api.post("/ai/chat/reset").then((r) => r.data));

// ——— Legacy aliases ———

export const getTasks = (params = {}) =>
  fetchTasks(params.date, {
    status: params.status,
    category: params.category,
    priority: params.priority,
  }, { page: params.page, limit: params.limit });

export const markTaskComplete = completeTask;
export const getTodayProgress = fetchTodayProgress;
export const getProgressRange = (params) =>
  fetchProgressRange(params.startDate, params.endDate);
export const getStats = fetchStats;
export const getHeatmapData = (params) => fetchHeatmapData(params.month);
export const generateAIInsights = generateInsights;
export const chatWithAI = ({ message, context }) => sendChatMessage(message, context);

export default api;
