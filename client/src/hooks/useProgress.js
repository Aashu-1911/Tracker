import { useCallback, useState } from "react";
import { format, subDays } from "date-fns";
import {
  getHeatmapData,
  getProgressRange,
  getStats,
  getTodayProgress,
} from "../services/api";

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

  const refresh = useCallback(
    async (options = {}) => {
      const monthDate = options.monthDate ? new Date(options.monthDate) : new Date(`${selectedMonth}-01`);
      const targetDate = options.selectedDate ? new Date(options.selectedDate) : new Date();
      const rangeEnd = new Date();
      const rangeStart = subDays(rangeEnd, 29);

      setLoading(true);
      setError("");

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

        setToday(todayData);
        setStats(statsData);
        setHeatmap(heatmapData || []);
        setTrend(trendData?.progress || []);
        setSelectedDay(selectedDayData?.progress?.[0] || null);
        setSelectedMonth(formatApiMonth(monthDate));
      } catch (err) {
        setError(err.message || "Failed to load progress.");
      } finally {
        setLoading(false);
      }
    },
    [selectedMonth]
  );

  const loadMonth = useCallback(async (monthDate) => refresh({ monthDate, selectedDate: selectedDay?.date }), [
    refresh,
    selectedDay,
  ]);

  const loadDay = useCallback(async (dateValue) => {
    const dateKey = typeof dateValue === "string" ? dateValue : formatApiDate(dateValue);

    try {
      const response = await getProgressRange({ startDate: dateKey, endDate: dateKey });
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
    refresh,
    loadMonth,
    loadDay,
  };
};

export default useProgress;
