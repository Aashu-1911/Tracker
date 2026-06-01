import { formatShortDate } from "../utils/dateUtils";

const TaskList = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return <div className="notice">No tasks to show yet.</div>;
  }

  return (
    <div className="list">
      {tasks.map((task) => (
        <div className="task-item" key={task._id || task.taskId}>
          <div>
            <h4>{task.title}</h4>
            <div className="task-meta">
              {task.category || "other"} · {formatShortDate(task.date)}
            </div>
          </div>
          <div className="status">{task.status}</div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
