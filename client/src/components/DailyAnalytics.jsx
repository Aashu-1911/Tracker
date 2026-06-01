import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_COLORS } from "../utils/colors";
import { formatDuration } from "../utils/calculations";
import { formatShortDate } from "../utils/dateUtils";

const categoryLabels = {
  work: "Work",
  health: "Health",
  personal: "Personal",
  learning: "Learning",
  other: "Other",
};

const DailyAnalytics = ({ day, trendAverage }) => {
  const comparisonData = useMemo(
    () => [
      {
        name: "Completion %",
        selected: day?.completionPercentage || 0,
        average: trendAverage?.completionPercentage || 0,
      },
      {
        name: "Completed tasks",
        selected: day?.completedTasks || 0,
        average: trendAverage?.completedTasks || 0,
      },
      {
        name: "Time spent",
        selected: day?.totalTimeSpent || 0,
        average: trendAverage?.timeSpent || 0,
      },
    ],
    [day, trendAverage]
  );

  const timeByCategory = useMemo(
    () =>
      Object.entries(day?.timeSpentByCategory || {}).filter(([, value]) => value > 0),
    [day]
  );

  if (!day) {
    return <div className="notice">Select a day in the chart or heatmap to inspect it.</div>;
  }

  return (
    <section className="card viz-card">
      <div className="viz-card__header">
        <div>
          <h3>Daily analytics</h3>
          <p className="meta">{formatShortDate(day.date)} breakdown and benchmark.</p>
        </div>
      </div>

      <div className="daily-analytics">
        <div className="daily-analytics__stats">
          <div className="metric-block">
            <span className="metric-block__label">Created</span>
            <strong>{day.totalTasks || 0}</strong>
          </div>
          <div className="metric-block">
            <span className="metric-block__label">Completed</span>
            <strong>{day.completedTasks || 0}</strong>
          </div>
          <div className="metric-block">
            <span className="metric-block__label">Pending</span>
            <strong>{day.statusBreakdown?.pending || 0}</strong>
          </div>
          <div className="metric-block">
            <span className="metric-block__label">In progress</span>
            <strong>{day.statusBreakdown?.["in-progress"] || 0}</strong>
          </div>
          <div className="metric-block">
            <span className="metric-block__label">Mood</span>
            <strong>{day.mood ? `${day.mood}/5` : "Not set"}</strong>
          </div>
          <div className="metric-block">
            <span className="metric-block__label">Notes</span>
            <strong>{day.notes || "No notes"}</strong>
          </div>
        </div>

        <div className="daily-analytics__content">
          <div className="daily-analytics__time">
            <h4>Time by category</h4>
            {timeByCategory.length === 0 ? (
              <p className="meta">No time entries recorded for this day.</p>
            ) : (
              <div className="category-time-list">
                {timeByCategory.map(([category, minutes]) => (
                  <div key={category} className="category-time-row">
                    <span
                      className="legend-chip__dot"
                      style={{ backgroundColor: CATEGORY_COLORS[category] }}
                    />
                    <span>{categoryLabels[category]}</span>
                    <strong>{formatDuration(minutes)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="daily-analytics__chart">
            <h4>Selected day vs 30-day average</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={comparisonData} barGap={10}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4dbd0" />
                <XAxis dataKey="name" stroke="#6b625a" />
                <YAxis stroke="#6b625a" />
                <Tooltip />
                <Bar dataKey="selected" name="Selected day" fill={CATEGORY_COLORS.overall} radius={[8, 8, 0, 0]} />
                <Bar dataKey="average" name="Average" fill={CATEGORY_COLORS.health} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DailyAnalytics;
