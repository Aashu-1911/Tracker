import { useCallback, useState } from "react";
import { format, subDays } from "date-fns";
import {
  fetchHeatmapData,
  fetchProgressRange,
  fetchStats,
  fetchTodayProgress,
} from "../services/api";
import { loadProgressBackup, saveProgressBackup } from "../utils/storage";

const formatApiDate = (value) => format(new Date(value), "yyyy-MM-dd");
const formatApiMonth = (value) => format(new Date(value), "yyyy-MM");

const useProgress = () => {
  const [today, setToday] = useState(null);
  const [stats, setStats] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [trend, setTrend] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(formatApiMonth(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromCache, setFromCache] = useState(false);

  const applyBackup = () => {
    const backup = loadProgressBackup();
    if (!backup) {
      return false;
    }
    if (backup.today) setToday(backup.today);
    if (backup.stats) setStats(backup.stats);
    if (backup.heatmap) setHeatmap(backup.heatmap);
    if (backup.trend) setTrend(backup.trend);
    setFromCache(true);
    setError("Showing saved progress while offline.");
    return true;
  };

  const refresh = useCallback(
    async (options = {}) => {
      const monthDate = options.monthDate
        ? new Date(options.monthDate)
        : new Date(`${selectedMonth}-01`);
      const targetDate = options.selectedDate ? new Date(options.selectedDate) : new Date();
      const rangeEnd = new Date();
      const rangeStart = subDays(rangeEnd, 29);

      setLoading(true);
      setError("");
      setFromCache(false);

      try {
        const [todayData, statsData, heatmapData, trendData, selectedDayData] = await Promise.all([
          fetchTodayProgress(),
          fetchStats(),
          fetchHeatmapData(formatApiMonth(monthDate)),
          fetchProgressRange(formatApiDate(rangeStart), formatApiDate(rangeEnd)),
          fetchProgressRange(formatApiDate(targetDate), formatApiDate(targetDate)),
        ]);

        setToday(todayData);
        setStats(statsData);
        setHeatmap(heatmapData || []);
        setTrend(trendData?.progress || []);
        setSelectedDay(selectedDayData?.progress?.[0] || null);
        setSelectedMonth(formatApiMonth(monthDate));
        saveProgressBackup({
          today: todayData,
          stats: statsData,
          heatmap: heatmapData,
          trend: trendData?.progress,
        });
      } catch (err) {
        if (!applyBackup()) {
          setError(err.message || "Failed to load progress.");
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedMonth]
  );

  const loadMonth = useCallback(
    async (monthDate) => refresh({ monthDate, selectedDate: selectedDay?.date }),
    [refresh, selectedDay]
  );

  const loadDay = useCallback(async (dateValue) => {
    const dateKey = typeof dateValue === "string" ? dateValue : formatApiDate(dateValue);

    try {
      const response = await fetchProgressRange(dateKey, dateKey);
      setSelectedDay(response?.progress?.[0] || null);
      return response?.progress?.[0] || null;
    } catch (err) {
      setError(err.message || "Failed to load selected day.");
      return null;
    }
  }, []);

  return {
    today,
    stats,
    heatmap,
    trend,
    selectedDay,
    selectedMonth,
    loading,
    error,
    fromCache,
    refresh,
    loadMonth,
    loadDay,
  };
};

export default useProgress;
