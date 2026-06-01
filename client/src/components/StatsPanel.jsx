import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import StatCard from "./StatCard";
import { CATEGORY_COLORS } from "../utils/colors";
import { formatDuration } from "../utils/calculations";

const categoryLabels = {
  work: "Work",
  health: "Health",
  personal: "Personal",
  learning: "Learning",
  other: "Other",
};

const StatsPanel = ({ stats }) => {
  const pieData = useMemo(
    () =>
      Object.entries(stats?.tasksPerCategory || {})
        .map(([key, value]) => ({
          name: categoryLabels[key] || key,
          value,
          color: CATEGORY_COLORS[key] || CATEGORY_COLORS.other,
        }))
        .filter((item) => item.value > 0),
    [stats]
  );

  return (
    <section className="stats-panel">
      <div className="grid">
        <StatCard
          label="Completed"
          value={stats?.totalCompletedEver || 0}
          meta="All-time finished tasks"
        />
        <StatCard
          label="Current streak"
          value={`${stats?.currentStreak || 0} days`}
          meta="Days above 50% completion"
        />
        <StatCard
          label="Average completion"
          value={`${stats?.averageCompletionPercentage || 0}%`}
          meta="Across all tracked tasks"
        />
        <StatCard
          label="Time spent"
          value={formatDuration(stats?.totalTimeSpent || 0)}
          meta="Logged across every category"
        />
      </div>

      <div className="card viz-card">
        <div className="viz-card__header">
          <div>
            <h3>Category distribution</h3>
            <p className="meta">Task volume split by category.</p>
          </div>
        </div>
        <div className="stats-panel__chart">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={92}
                paddingAngle={4}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="stats-panel__legend">
            {pieData.map((entry) => (
              <div key={entry.name} className="legend-chip">
                <span
                  className="legend-chip__dot"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}</span>
                <strong>{entry.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsPanel;
