const Task = require("../models/Task");
const DailyProgress = require("../models/DailyProgress");

const allowedCategories = ["work", "health", "personal", "learning", "other"];

const initCategoryCounts = () => ({
  work: 0,
  health: 0,
  personal: 0,
  learning: 0,
  other: 0,
});

const buildUtcRange = (dateInput) => {
  const dateString = String(dateInput).trim();
  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  let date;

  if (dateOnlyMatch) {
    const [year, month, day] = dateString.split("-").map((value) => parseInt(value, 10));
    date = new Date(Date.UTC(year, month - 1, day));
  } else {
    date = new Date(dateString);
  }

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
};

const normalizeDateInput = (dateInput) => {
  const range = buildUtcRange(dateInput);
  return range ? range.start : null;
};

const formatDateKey = (date) => {
  if (!date) {
    return "";
  }

  const utcDate = new Date(date);
  return utcDate.toISOString().slice(0, 10);
};

const listUtcDays = (start, end) => {
  const days = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
};

const computeDailyMetrics = (tasks) => {
  const totals = {
    totalTasks: tasks.length,
    completedTasks: 0,
    completionPercentage: 0,
    tasksPerCategory: initCategoryCounts(),
    averageTimePerTask: 0,
  };

  let timeSpentTotal = 0;
  let timeSpentCount = 0;

  tasks.forEach((task) => {
    const category = allowedCategories.includes(task.category) ? task.category : "other";
    totals.tasksPerCategory[category] += 1;

    if (task.status === "completed") {
      totals.completedTasks += 1;
    }

    if (typeof task.timeSpent === "number" && Number.isFinite(task.timeSpent)) {
      timeSpentTotal += task.timeSpent;
      timeSpentCount += 1;
    }
  });

  if (totals.totalTasks > 0) {
    totals.completionPercentage = Math.round(
      (totals.completedTasks / totals.totalTasks) * 100
    );
  }

  if (timeSpentCount > 0) {
    totals.averageTimePerTask = Math.round(timeSpentTotal / timeSpentCount);
  }

  return totals;
};

const updateDailyProgressForDate = async (dateInput) => {
  const range = buildUtcRange(dateInput);
  if (!range) {
    return null;
  }

  const tasks = await Task.find({
    date: { $gte: range.start, $lte: range.end },
  }).lean();

  const metrics = computeDailyMetrics(tasks);

  const updated = await DailyProgress.findOneAndUpdate(
    { date: range.start },
    {
      $set: metrics,
      $setOnInsert: { date: range.start },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return updated;
};

module.exports = {
  allowedCategories,
  buildUtcRange,
  normalizeDateInput,
  formatDateKey,
  listUtcDays,
  computeDailyMetrics,
  updateDailyProgressForDate,
};
