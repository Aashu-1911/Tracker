import { useMemo } from "react";
import { format } from "date-fns";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import Heatmap from "../components/Heatmap";
import DailyAnalytics from "../components/DailyAnalytics";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import useAppContext from "../hooks/useAppContext";

const TasksPage = ({ viewMode }) => {
  const {
    tasks,
    progress,
    selectedDate,
    tasksLoading,
    tasksError,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    loadTasks,
    loadSelectedDay,
    loadProgressMonth,
    setSelectedDate,
  } = useAppContext();

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
        <h2 className="page-title">Tasks</h2>
        <p className="page-subtitle">
          Focused work for {format(new Date(selectedDate), "MMMM d, yyyy")}.
        </p>
      </div>

      <TaskForm onCreate={addTask} />

      {(tasksLoading || progress.loading) ? (
        <LoadingState label="Updating your workspace..." />
      ) : null}
      {tasksError ? <ErrorState message={tasksError} /> : null}
      {progress.error ? <ErrorState message={progress.error} /> : null}

      {viewMode === "calendar" ? (
        <div className="section">
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
      ) : (
        <TaskList
          tasks={tasks}
          loading={tasksLoading}
          error={tasksError}
          showToolbar={false}
          title="Selected day tasks"
          subtitle="Your list reflects the global date and sidebar filters."
          emptyMessage="No tasks are scheduled for the current filters."
          onRefresh={() => loadTasks({})}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onToggleComplete={toggleComplete}
        />
      )}
    </div>
  );
};

export default TasksPage;
