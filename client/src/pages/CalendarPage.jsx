import { useMemo } from "react";
import { eachDayOfInterval, format, startOfWeek, endOfWeek } from "date-fns";
import Heatmap from "../components/Heatmap";
import DailyAnalytics from "../components/DailyAnalytics";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import useAppContext from "../hooks/useAppContext";

const CalendarPage = () => {
  const { progress, selectedDate, setSelectedDate, loadSelectedDay, loadProgressMonth } =
    useAppContext();

  const weekDates = useMemo(() => {
    const anchor = new Date(selectedDate);
    return eachDayOfInterval({
      start: startOfWeek(anchor, { weekStartsOn: 1 }),
      end: endOfWeek(anchor, { weekStartsOn: 1 }),
    });
  }, [selectedDate]);

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
        <h2 className="page-title">Calendar</h2>
        <p className="page-subtitle">Scan the month, then drill into the selected day.</p>
      </div>

      {progress.loading ? <LoadingState label="Loading calendar..." /> : null}
      {progress.error ? <ErrorState message={progress.error} /> : null}

      <div className="card week-strip-card">
        <h3>This week</h3>
        <div className="week-strip">
          {weekDates.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const isActive = key === (progress.selectedDay?.date || selectedDate);
            return (
              <button
                key={key}
                type="button"
                className={`week-day-chip ${isActive ? "week-day-chip--active" : ""}`}
                onClick={async () => {
                  await setSelectedDate(key);
                  await loadSelectedDay(key);
                }}
              >
                <span>{format(day, "EEE")}</span>
                <strong>{format(day, "d")}</strong>
              </button>
            );
          })}
        </div>
      </div>

      <Heatmap
        values={progress.heatmap}
        month={progress.selectedMonth}
        selectedDate={progress.selectedDay?.date || selectedDate}
        onMonthChange={loadProgressMonth}
        onSelectDate={async (dateKey) => {
          await setSelectedDate(dateKey);
          await loadSelectedDay(dateKey);
        }}
      />
      <DailyAnalytics day={progress.selectedDay} trendAverage={averageComparison} />
    </div>
  );
};

export default CalendarPage;
