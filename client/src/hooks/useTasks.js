import { useCallback, useRef, useState } from "react";
import {
  createTask,
  deleteTask,
  getTasks,
  markTaskComplete,
  updateTask,
} from "../services/api";

const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastParamsRef = useRef({ page: 1, limit: 20 });

  const fetchTasks = useCallback(async (params) => {
    setLoading(true);
    setError("");
    lastParamsRef.current = params || lastParamsRef.current;

    try {
      const response = await getTasks(lastParamsRef.current);
      setTasks(response.tasks || []);
      setCount(response.count || 0);
    } catch (err) {
      setError(err.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => fetchTasks(lastParamsRef.current), [fetchTasks]);

  const handleCreate = useCallback(async (payload) => {
    setError("");
    const task = await createTask(payload);
    setTasks((prev) => [task, ...prev]);
    setCount((prev) => prev + 1);
    return task;
  }, []);

  const handleUpdate = useCallback(async (id, payload) => {
    setError("");
    const updated = await updateTask(id, payload);
    setTasks((prev) => prev.map((task) => (task._id === updated._id ? updated : task)));
    return updated;
  }, []);

  const handleDelete = useCallback(async (id) => {
    setError("");
    await deleteTask(id);
    setTasks((prev) => prev.filter((task) => task._id !== id));
    setCount((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleToggleComplete = useCallback(
    async (task) => {
      if (!task || !task._id) {
        return null;
      }

      if (task.status === "completed") {
        return handleUpdate(task._id, { status: "pending" });
      }

      const updated = await markTaskComplete(task._id, {});
      setTasks((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      return updated;
    },
    [handleUpdate]
  );

  return {
    tasks,
    count,
    loading,
    error,
    fetchTasks,
    refresh,
    createTask: handleCreate,
    updateTask: handleUpdate,
    deleteTask: handleDelete,
    toggleComplete: handleToggleComplete,
  };
};

export default useTasks;
