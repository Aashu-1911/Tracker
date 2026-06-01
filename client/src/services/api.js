import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

const handleResponse = (response) => response.data;

export const createTask = (payload) => api.post("/tasks", payload).then(handleResponse);
export const getTasks = (params) => api.get("/tasks", { params }).then(handleResponse);
export const getTaskById = (id) => api.get(`/tasks/${id}`).then(handleResponse);
export const updateTask = (id, payload) =>
  api.put(`/tasks/${id}`, payload).then(handleResponse);
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then(handleResponse);
export const getTasksByDate = (date) => api.get(`/tasks/date/${date}`).then(handleResponse);
export const markTaskComplete = (id, payload) =>
  api.patch(`/tasks/${id}/complete`, payload).then(handleResponse);

export const getTodayProgress = () => api.get("/progress/today").then(handleResponse);
export const getProgressRange = (params) =>
  api.get("/progress/range", { params }).then(handleResponse);
export const getStats = () => api.get("/progress/stats").then(handleResponse);
export const getHeatmapData = (params) =>
  api.get("/progress/heatmap", { params }).then(handleResponse);
export const getWeeklySummary = () => api.get("/progress/weekly").then(handleResponse);
export const updateProgress = (payload) =>
  api.post("/progress/update", payload).then(handleResponse);

export const generateAIInsights = (payload) =>
  api.post("/ai/generate-insights", payload).then(handleResponse);
export const chatWithAI = (payload) => api.post("/ai/chat", payload).then(handleResponse);
export const clearAIChat = () => api.post("/ai/chat/reset").then(handleResponse);

export default api;
