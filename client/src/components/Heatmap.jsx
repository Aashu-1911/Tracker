import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { getHeatmapClass } from "../utils/colors";

const Heatmap = ({ values }) => {
  const safeValues = Array.isArray(values) ? values : [];

  if (safeValues.length === 0) {
    return <div className="notice">No heatmap data available yet.</div>;
  }

  const startDate = safeValues[0].date;
  const endDate = safeValues[safeValues.length - 1].date;

  return (
    <div className="card heatmap">
      <h3>Completion heatmap</h3>
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={safeValues}
        classForValue={getHeatmapClass}
        tooltipDataAttrs={(value) => {
          if (!value || !value.date) {
            return { "data-tip": "No data" };
          }
          return {
            "data-tip": `${value.date}: ${value.value}% (${value.completedCount}/${value.taskCount})`,
          };
        }}
        showWeekdayLabels
      />
    </div>
  );
};

export default Heatmap;
