import { useCallback, useRef, useState } from "react";
import {
  completeTask,
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from "../services/api";
import { loadTasksBackup, saveTasksBackup } from "../utils/storage";

const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const lastParamsRef = useRef({ date: null, filters: {} });

  const fetchTaskList = useCallback(async (date, filters = {}) => {
    setLoading(true);
    setError("");
    setFromCache(false);
    lastParamsRef.current = { date, filters };

    try {
      const response = await fetchTasks(date, filters);
      const nextTasks = response.tasks || [];
      setTasks(nextTasks);
      setCount(response.count || 0);
      saveTasksBackup(nextTasks, { date, filters });
      return nextTasks;
    } catch (err) {
      const backup = loadTasksBackup();
      if (backup.length) {
        setTasks(backup);
        setCount(backup.length);
        setFromCache(true);
        setError("Showing saved tasks while offline.");
        return backup;
      }
      setError(err.message || "Failed to load tasks.");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const { date, filters } = lastParamsRef.current;
    return fetchTaskList(date, filters);
  }, [fetchTaskList]);

  const handleCreate = useCallback(async (payload) => {
    setError("");
    try {
      const task = await createTask(payload);
      setTasks((prev) => [task, ...prev]);
      setCount((prev) => prev + 1);
      saveTasksBackup([task, ...tasks]);
      return task;
    } catch (err) {
      setError(err.message || "Failed to create task.");
      throw err;
    }
  }, [tasks]);

  const handleUpdate = useCallback(async (id, payload) => {
    setError("");
    try {
      const updated = await updateTask(id, payload);
      setTasks((prev) => prev.map((task) => (task._id === updated._id ? updated : task)));
      return updated;
    } catch (err) {
      setError(err.message || "Failed to update task.");
      throw err;
    }
  }, []);

  const handleDelete = useCallback(async (id) => {
    setError("");
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((task) => task._id !== id));
      setCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      setError(err.message || "Failed to delete task.");
      throw err;
    }
  }, []);

  const handleToggleComplete = useCallback(
    async (task) => {
      if (!task || !task._id) {
        return null;
      }

      try {
        if (task.status === "completed") {
          return handleUpdate(task._id, { status: "pending" });
        }

        const updated = await completeTask(task._id, {});
        setTasks((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
        return updated;
      } catch (err) {
        setError(err.message || "Failed to update task status.");
        throw err;
      }
    },
    [handleUpdate]
  );

  return {
    tasks,
    count,
    loading,
    error,
    fromCache,
    fetchTasks: fetchTaskList,
    refresh,
    createTask: handleCreate,
    updateTask: handleUpdate,
    deleteTask: handleDelete,
    toggleComplete: handleToggleComplete,
  };
};

export default useTasks;
