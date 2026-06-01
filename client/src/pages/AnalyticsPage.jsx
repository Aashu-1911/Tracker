import { useEffect, useMemo, useRef } from "react";
import StatsPanel from "../components/StatsPanel";
import ProgressChart from "../components/ProgressChart";
import DailyAnalytics from "../components/DailyAnalytics";
import Heatmap from "../components/Heatmap";
import AIInsights from "../components/AIInsights";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import useAppContext from "../hooks/useAppContext";

const AnalyticsPage = () => {
  const {
    progress,
    selectedDate,
    loadAnalyticsData,
    loadSelectedDay,
    loadProgressMonth,
    loadTasks,
  } = useAppContext();
  const didLoadRef = useRef(false);

  useEffect(() => {
    if (didLoadRef.current) {
      return;
    }
    didLoadRef.current = true;
    loadAnalyticsData({ selectedDate });
  }, [loadAnalyticsData, selectedDate]);

  const averageComparison = useMemo(() => {
    const safeTrend = Array.isArray(progress.trend) ? progress.trend : [];
    if (safeTrend.length === 0) {
      return { completionPercentage: 0, completedTasks: 0, timeSpent: 0 };
    }

    const totals = safeTrend.reduce(
      (acc, day) => ({
        completionPercentage: acc.completionPercentage + (day.completionPercentage || 0),
        completedTasks: acc.completedTasks + (day.completedTasks || 0),
        timeSpent: acc.timeSpent + (day.totalTimeSpent || 0),
      }),
      { completionPercentage: 0, completedTasks: 0, timeSpent: 0 }
    );

    return {
      completionPercentage: Math.round(totals.completionPercentage / safeTrend.length),
      completedTasks: Math.round(totals.completedTasks / safeTrend.length),
      timeSpent: Math.round(totals.timeSpent / safeTrend.length),
    };
  }, [progress.trend]);

  return (
    <div className="section">
      <div>
        <h2 className="page-title">Analytics</h2>
        <p className="page-subtitle">Patterns, pace, and guidance across your recent work.</p>
      </div>

      {progress.loading ? <LoadingState label="Loading analytics..." /> : null}
      {progress.error ? (
        <ErrorState message={progress.error} onRetry={() => loadAnalyticsData({ selectedDate })} />
      ) : null}
      {progress.fromCache ? (
        <p className="meta">Showing saved data — reconnect to refresh from the server.</p>
      ) : null}

      <StatsPanel stats={progress.stats} />
      <ProgressChart data={progress.trend} onSelectDate={loadSelectedDay} />
      <Heatmap
        values={progress.heatmap}
        month={progress.selectedMonth}
        selectedDate={progress.selectedDay?.date || selectedDate}
        onMonthChange={loadProgressMonth}
        onSelectDate={loadSelectedDay}
      />
      <DailyAnalytics day={progress.selectedDay} trendAverage={averageComparison} />
      <AIInsights onInsightsApplied={() => loadTasks({})} />
    </div>
  );
};

export default AnalyticsPage;
