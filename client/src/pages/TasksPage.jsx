import { useEffect } from "react";
import useTasks from "../hooks/useTasks";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";

const TasksPage = () => {
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
  } = useTasks();

  useEffect(() => {
    fetchTasks({ page: 1, limit: 20 });
  }, [fetchTasks]);

  return (
    <div className="section">
      <div>
        <h2 className="page-title">Tasks</h2>
        <p className="page-subtitle">Review and manage your workflow.</p>
      </div>

      <TaskForm onCreate={createTask} />
      <TaskList
        tasks={tasks}
        loading={loading}
        error={error}
        onRefresh={(params) => fetchTasks({ page: 1, limit: 20, ...params })}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onToggleComplete={toggleComplete}
      />
    </div>
  );
};

export default TasksPage;
