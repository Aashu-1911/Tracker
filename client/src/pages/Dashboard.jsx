import { useEffect, useMemo } from "react";
import ProgressChart from "../components/ProgressChart";
import StatsPanel from "../components/StatsPanel";
import TaskList from "../components/TaskList";
import Heatmap from "../components/Heatmap";
import DailyAnalytics from "../components/DailyAnalytics";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import useTasks from "../hooks/useTasks";
import useProgress from "../hooks/useProgress";

const Dashboard = () => {
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    fetchTasks,
    updateTask,
    deleteTask,
    toggleComplete,
  } = useTasks();
  const {
    today,
    stats,
    heatmap,
    trend,
    selectedDay,
    selectedMonth,
    loading: progressLoading,
    error: progressError,
    refresh,
    loadMonth,
    loadDay,
  } = useProgress();

  useEffect(() => {
    fetchTasks({ page: 1, limit: 6 });
    refresh();
  }, [fetchTasks, refresh]);

  const averageComparison = useMemo(() => {
    const safeTrend = Array.isArray(trend) ? trend : [];
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
  }, [trend]);

  const refreshDashboard = async () => {
    await Promise.all([fetchTasks({ page: 1, limit: 6 }), refresh({ selectedDate: selectedDay?.date })]);
  };

  const handleToggleComplete = async (task) => {
    await toggleComplete(task);
    await refreshDashboard();
  };

  const handleUpdateTask = async (id, payload) => {
    await updateTask(id, payload);
    await refreshDashboard();
  };

  const handleDeleteTask = async (id) => {
    await deleteTask(id);
    await refreshDashboard();
  };

  return (
    <div className="section">
      <div>
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">Track progress at a glance.</p>
      </div>

      {(tasksLoading || progressLoading) && <LoadingState label="Fetching data..." />}
      {(tasksError || progressError) && (
        <ErrorState message={tasksError || progressError} />
      )}

      <StatsPanel stats={stats} />

      <div className="grid dashboard-highlight-grid">
        <div className="card dashboard-today-card">
          <h3>Today</h3>
          <p className="stat">{today?.completionPercentage || 0}%</p>
          <p className="meta">
            {today?.completedTasks || 0} of {today?.totalTasks || 0} tasks completed today
          </p>
        </div>
        <ProgressChart data={trend} onSelectDate={loadDay} />
      </div>

      <div className="dashboard-analytics-grid">
        <Heatmap
          values={heatmap}
          month={selectedMonth}
          selectedDate={selectedDay?.date}
          onMonthChange={loadMonth}
          onSelectDate={loadDay}
        />
        <DailyAnalytics day={selectedDay} trendAverage={averageComparison} />
      </div>

      <div className="section">
        <div className="section-header">
          <h3>Recent tasks</h3>
        </div>
        <TaskList
          tasks={tasks}
          onRefresh={(params) => fetchTasks({ page: 1, limit: 6, ...params })}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
        />
      </div>
    </div>
  );
};

export default Dashboard;
