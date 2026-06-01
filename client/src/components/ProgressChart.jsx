import { useMemo, useState } from "react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_COLORS } from "../utils/colors";
import { formatShortDate } from "../utils/dateUtils";

const categoryConfig = [
  { key: "work", label: "Work" },
  { key: "health", label: "Health" },
  { key: "personal", label: "Personal" },
  { key: "learning", label: "Learning" },
  { key: "other", label: "Other" },
];

const ProgressChart = ({ data, onSelectDate }) => {
  const [hiddenKeys, setHiddenKeys] = useState([]);

  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : []).map((entry) => ({
        ...entry,
        label: formatShortDate(entry.date),
        overall: entry.completionPercentage || 0,
        work: entry.completionPercentageByCategory?.work || 0,
        health: entry.completionPercentageByCategory?.health || 0,
        personal: entry.completionPercentageByCategory?.personal || 0,
        learning: entry.completionPercentageByCategory?.learning || 0,
        other: entry.completionPercentageByCategory?.other || 0,
      })),
    [data]
  );

  const handleLegendClick = (payload) => {
    if (!payload?.dataKey || payload.dataKey === "overall") {
      return;
    }

    setHiddenKeys((prev) =>
      prev.includes(payload.dataKey)
        ? prev.filter((key) => key !== payload.dataKey)
        : [...prev, payload.dataKey]
    );
  };

  if (chartData.length === 0) {
    return <div className="notice">No trend data available for the last 30 days.</div>;
  }

  return (
    <section className="card viz-card">
      <div className="viz-card__header">
        <div>
          <h3>30-day completion trend</h3>
          <p className="meta">Toggle categories in the legend to focus the chart.</p>
        </div>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 18, left: 0, bottom: 8 }}
            onClick={(state) => {
              const date = state?.activePayload?.[0]?.payload?.date;
              if (date && onSelectDate) {
                onSelectDate(date);
              }
            }}
          >
            <XAxis dataKey="label" minTickGap={20} stroke="#6b625a" />
            <YAxis domain={[0, 100]} tickCount={6} stroke="#6b625a" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) {
                  return null;
                }

                const point = payload[0].payload;

                return (
                  <div className="chart-tooltip">
                    <strong>{label}</strong>
                    <span>{point.completedTasks} completed</span>
                    <span>{point.totalTasks} total tasks</span>
                    <span>{point.completionPercentage}% completion</span>
                  </div>
                );
              }}
            />
            <Legend onClick={handleLegendClick} />
            <Line
              type="monotone"
              dataKey="overall"
              name="Overall"
              stroke={CATEGORY_COLORS.overall}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />
            {categoryConfig.map((category) => (
              <Line
                key={category.key}
                type="monotone"
                dataKey={category.key}
                name={category.label}
                hide={hiddenKeys.includes(category.key)}
                stroke={CATEGORY_COLORS[category.key]}
                strokeWidth={2}
                strokeDasharray="6 5"
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default ProgressChart;
