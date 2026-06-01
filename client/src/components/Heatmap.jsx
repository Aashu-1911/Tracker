import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, startOfMonth, subMonths } from "date-fns";
import { getHeatmapColor, HEATMAP_LEVELS } from "../utils/colors";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Heatmap = ({ values, month, onMonthChange, onSelectDate, selectedDate }) => {
  const safeValues = Array.isArray(values) ? values : [];
  const monthDate = new Date(`${month}-01`);
  const days = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  });
  const valueMap = new Map(safeValues.map((entry) => [entry.date, entry]));
  const leadingBlankDays = Array.from({ length: getDay(startOfMonth(monthDate)) }, (_, index) => index);

  return (
    <section className="card viz-card">
      <div className="viz-card__header">
        <div>
          <h3>Monthly activity heatmap</h3>
          <p className="meta">Click a day to inspect its breakdown.</p>
        </div>
        <div className="heatmap-nav">
          <button className="button secondary" type="button" onClick={() => onMonthChange?.(subMonths(monthDate, 1))}>
            Previous
          </button>
          <strong>{format(monthDate, "MMMM yyyy")}</strong>
          <button className="button secondary" type="button" onClick={() => onMonthChange?.(addMonths(monthDate, 1))}>
            Next
          </button>
        </div>
      </div>

      <div className="heatmap-grid heatmap-grid--labels">
        {weekdayLabels.map((label) => (
          <span key={label} className="heatmap-weekday">
            {label}
          </span>
        ))}
      </div>
      <div className="heatmap-grid">
        {leadingBlankDays.map((value) => (
          <div key={`blank-${value}`} className="heatmap-cell heatmap-cell--blank" />
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const entry = valueMap.get(dateKey) || {
            date: dateKey,
            value: 0,
            completedCount: 0,
            taskCount: 0,
          };
          const isActive = selectedDate === dateKey;

          return (
            <button
              key={dateKey}
              type="button"
              className={`heatmap-cell ${isActive ? "heatmap-cell--active" : ""}`}
              style={{ backgroundColor: getHeatmapColor(entry.value) }}
              onClick={() => onSelectDate?.(dateKey)}
              title={`${dateKey}: ${entry.completedCount}/${entry.taskCount} tasks completed (${entry.value}%)`}
            >
              <span>{format(day, "d")}</span>
            </button>
          );
        })}
      </div>

      <div className="heatmap-legend">
        {[0, 25, 50, 75, 100].map((value, index) => (
          <div key={value} className="legend-chip">
            <span
              className="legend-chip__swatch"
              style={{ backgroundColor: HEATMAP_LEVELS[index] }}
            />
            <span>{value}%</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Heatmap;
