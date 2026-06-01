import { useCallback, useState } from "react";
import {
  getTodayProgress,
  getStats,
  getHeatmapData,
  getWeeklySummary,
} from "../services/api";

const useProgress = () => {
  const [today, setToday] = useState(null);
  const [stats, setStats] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [todayData, statsData, heatmapData, weeklyData] = await Promise.all([
        getTodayProgress(),
        getStats(),
        getHeatmapData(),
        getWeeklySummary(),
      ]);
      setToday(todayData);
      setStats(statsData);
      setHeatmap(heatmapData || []);
      setWeekly(weeklyData || []);
    } catch (err) {
      setError(err.message || "Failed to load progress.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    today,
    stats,
    heatmap,
    weekly,
    loading,
    error,
    refresh,
  };
};

export default useProgress;
