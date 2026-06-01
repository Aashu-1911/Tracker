import { useEffect } from "react";
import StatCard from "../components/StatCard";
import TaskList from "../components/TaskList";
import Heatmap from "../components/Heatmap";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import useTasks from "../hooks/useTasks";
import useProgress from "../hooks/useProgress";

const Dashboard = () => {
  const { tasks, loading: tasksLoading, error: tasksError, fetchTasks } = useTasks();
  const {
    today,
    stats,
    heatmap,
    loading: progressLoading,
    error: progressError,
    refresh,
  } = useProgress();

  useEffect(() => {
    fetchTasks({ page: 1, limit: 6 });
    refresh();
  }, [fetchTasks, refresh]);

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

      <div className="grid">
        <StatCard
          label="Today"
          value={`${today?.completedTasks || 0}/${today?.totalTasks || 0}`}
          meta={`Completion ${today?.completionPercentage || 0}%`}
        />
        <StatCard
          label="All time"
          value={`${stats?.totalCompletedEver || 0} done`}
          meta={`Total tasks ${stats?.totalTasksEver || 0}`}
        />
        <StatCard
          label="Streak"
          value={`${stats?.currentStreak || 0} days`}
          meta="Completion above 50%"
        />
        <StatCard
          label="Average pace"
          value={`${stats?.averageTimePerTask || 0} min`}
          meta="Per completed task"
        />
      </div>

      <div className="section">
        <div className="section-header">
          <h3>Recent tasks</h3>
        </div>
        <TaskList tasks={tasks} />
      </div>

      <Heatmap values={heatmap} />
    </div>
  );
};

export default Dashboard;
