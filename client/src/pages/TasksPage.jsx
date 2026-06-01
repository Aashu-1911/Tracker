import { useEffect } from "react";
import useTasks from "../hooks/useTasks";
import TaskList from "../components/TaskList";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

const TasksPage = () => {
  const { tasks, loading, error, fetchTasks } = useTasks();

  useEffect(() => {
    fetchTasks({ page: 1, limit: 20 });
  }, [fetchTasks]);

  return (
    <div className="section">
      <div>
        <h2 className="page-title">Tasks</h2>
        <p className="page-subtitle">Review and manage your workflow.</p>
      </div>

      {loading && <LoadingState label="Loading tasks..." />}
      {error && <ErrorState message={error} />}

      <TaskList tasks={tasks} />
    </div>
  );
};

export default TasksPage;
