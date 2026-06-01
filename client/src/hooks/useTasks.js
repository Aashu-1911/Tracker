import { useCallback, useState } from "react";
import { getTasks } from "../services/api";

const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async (params) => {
    setLoading(true);
    setError("");

    try {
      const response = await getTasks(params);
      setTasks(response.tasks || []);
      setCount(response.count || 0);
    } catch (err) {
      setError(err.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tasks,
    count,
    loading,
    error,
    fetchTasks,
  };
};

export default useTasks;
