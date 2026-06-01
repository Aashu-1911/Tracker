import { useAppContextState } from "../context/AppContext";

const useAppContext = () => {
  const context = useAppContextState();

  return {
    ...context,
    tasks: context.state.tasks,
    progress: context.state.progress,
    selectedDate: context.state.selectedDate,
    filters: context.state.filters,
    aiChat: context.state.aiChat,
    notifications: context.state.notifications,
    tasksLoading: context.state.tasksLoading,
    tasksError: context.state.tasksError,
    tasksFromCache: context.state.tasksFromCache,
  };
};

export default useAppContext;
