export const calculateCompletionPercentage = (completed, total) => {
  if (!total || total <= 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
};

export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) {
    return "0 min";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours <= 0) {
    return `${remainder} min`;
  }

  return `${hours}h ${remainder}m`;
};
