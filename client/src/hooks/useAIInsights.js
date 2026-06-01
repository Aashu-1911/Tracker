import { useCallback, useState } from "react";
import { generateInsights, getTodayRecommendation } from "../services/api";

const useAIInsights = () => {
  const [insight, setInsight] = useState("");
  const [tasks, setTasks] = useState([]);
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = useCallback(async (payload) => {
    setLoading(true);
    setError("");

    try {
      const response = await generateInsights(payload);
      setInsight(response?.generalInsight || "");
      setTasks(response?.tasks || []);
      return response;
    } catch (err) {
      const message = err.message || "Unable to generate insights.";
      setError(message);
      setInsight("");
      setTasks([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecommendation = useCallback(async (contextTasks = []) => {
    setLoading(true);
    setError("");

    try {
      const response = await getTodayRecommendation(contextTasks);
      const text = response?.recommendation || "";
      setRecommendation(text);
      return text;
    } catch (err) {
      const message = err.message || "Unable to load recommendation.";
      setError(message);
      setRecommendation("");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setInsight("");
    setTasks([]);
    setRecommendation("");
    setError("");
  }, []);

  return {
    insight,
    tasks,
    recommendation,
    loading,
    error,
    generate,
    fetchRecommendation,
    reset,
    setInsight,
    setTasks,
  };
};

export default useAIInsights;
