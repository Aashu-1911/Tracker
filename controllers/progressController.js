const Task = require("../models/Task");
const DailyProgress = require("../models/DailyProgress");
const {
  allowedCategories,
  buildUtcRange,
  normalizeDateInput,
  formatDateKey,
  listUtcDays,
  computeDailyMetrics,
  updateDailyProgressForDate,
} = require("../utils/progress");

const getDateRangeFromQuery = (startDate, endDate) => {
  const startRange = buildUtcRange(startDate);
  const endRange = buildUtcRange(endDate);

  if (!startRange || !endRange) {
    return null;
  }

  return { start: startRange.start, end: endRange.end };
};

const buildMonthRange = (monthString) => {
  const monthValue = String(monthString || "").trim();
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(monthValue);

  if (!monthMatch) {
    return null;
  }

  const year = parseInt(monthMatch[1], 10);
  const monthIndex = parseInt(monthMatch[2], 10) - 1;

  if (monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
};

const getWeekStartUtc = (date) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay();
  const diff = (day + 6) % 7;
  start.setUTCDate(start.getUTCDate() - diff);
  return start;
};

const getTodayProgress = async (req, res) => {
  try {
    const progress = await updateDailyProgressForDate(new Date());
    if (!progress) {
      return res.status(400).json({ message: "Invalid date" });
    }

    return res.status(200).json(progress);
  } catch (error) {
    console.error("Error fetching today's progress:", error);
    return res.status(500).json({ message: "Failed to fetch progress" });
  }
};

const getProgressRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }

    const range = getDateRangeFromQuery(startDate, endDate);
    if (!range) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (range.start > range.end) {
      return res.status(400).json({ message: "startDate must be before endDate" });
    }

    const days = listUtcDays(range.start, range.end);
    if (days.length > 366) {
      return res.status(400).json({ message: "Date range too large" });
    }

    const [tasks, progressDocs] = await Promise.all([
      Task.find({ date: { $gte: range.start, $lte: range.end } }).lean(),
      DailyProgress.find({ date: { $gte: range.start, $lte: range.end } }).lean(),
    ]);

    const tasksByDay = new Map();
    tasks.forEach((task) => {
      const key = formatDateKey(task.date);
      if (!tasksByDay.has(key)) {
        tasksByDay.set(key, []);
      }
      tasksByDay.get(key).push(task);
    });

    const progressByDay = new Map();
    progressDocs.forEach((progress) => {
      const key = formatDateKey(progress.date);
      progressByDay.set(key, progress);
    });

    let totalTasks = 0;
    let totalCompleted = 0;
    let completionSum = 0;

    const progressList = days.map((day) => {
      const key = formatDateKey(day);
      const dayTasks = tasksByDay.get(key) || [];
      const metrics = computeDailyMetrics(dayTasks);
      const existing = progressByDay.get(key);

      totalTasks += metrics.totalTasks;
      totalCompleted += metrics.completedTasks;
      completionSum += metrics.completionPercentage;

      return {
        date: key,
        totalTasks: metrics.totalTasks,
        completedTasks: metrics.completedTasks,
        completionPercentage: metrics.completionPercentage,
        tasksPerCategory: metrics.tasksPerCategory,
        averageTimePerTask: metrics.averageTimePerTask,
        mood: existing ? existing.mood : null,
        notes: existing ? existing.notes : "",
      };
    });

    const averageCompletionPercentage = days.length
      ? Math.round(completionSum / days.length)
      : 0;

    return res.status(200).json({
      range: {
        startDate: formatDateKey(range.start),
        endDate: formatDateKey(range.end),
      },
      totals: {
        totalTasks,
        totalCompleted,
        averageCompletionPercentage,
      },
      progress: progressList,
    });
  } catch (error) {
    console.error("Error fetching progress range:", error);
    return res.status(500).json({ message: "Failed to fetch progress range" });
  }
};

const getProgressStats = async (req, res) => {
  try {
    const tasks = await Task.find().lean();

    const totals = {
      totalTasksEver: tasks.length,
      totalCompletedEver: 0,
      averageCompletionPercentage: 0,
      currentStreak: 0,
      bestDay: null,
      tasksPerCategory: {},
      averageTimePerTask: 0,
      taskCompletionByCategory: {},
    };

    const categoryCounts = {};
    const categoryCompletion = {};
    allowedCategories.forEach((category) => {
      categoryCounts[category] = 0;
      categoryCompletion[category] = { total: 0, completed: 0, completionPercentage: 0 };
    });

    let timeSpentTotal = 0;
    let timeSpentCount = 0;

    const dailyMap = new Map();

    tasks.forEach((task) => {
      const category = allowedCategories.includes(task.category) ? task.category : "other";
      categoryCounts[category] += 1;
      categoryCompletion[category].total += 1;

      if (task.status === "completed") {
        totals.totalCompletedEver += 1;
        categoryCompletion[category].completed += 1;
      }

      if (typeof task.timeSpent === "number" && Number.isFinite(task.timeSpent)) {
        timeSpentTotal += task.timeSpent;
        timeSpentCount += 1;
      }

      const dayKey = formatDateKey(task.date);
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { total: 0, completed: 0 });
      }
      const dayEntry = dailyMap.get(dayKey);
      dayEntry.total += 1;
      if (task.status === "completed") {
        dayEntry.completed += 1;
      }
    });

    totals.tasksPerCategory = categoryCounts;

    Object.keys(categoryCompletion).forEach((category) => {
      const entry = categoryCompletion[category];
      if (entry.total > 0) {
        entry.completionPercentage = Math.round((entry.completed / entry.total) * 100);
      }
    });

    totals.taskCompletionByCategory = categoryCompletion;

    if (totals.totalTasksEver > 0) {
      totals.averageCompletionPercentage = Math.round(
        (totals.totalCompletedEver / totals.totalTasksEver) * 100
      );
    }

    if (timeSpentCount > 0) {
      totals.averageTimePerTask = Math.round(timeSpentTotal / timeSpentCount);
    }

    const today = new Date();
    const todayKey = formatDateKey(today);
    const dailyKeys = Array.from(dailyMap.keys()).sort();

    if (dailyKeys.length > 0) {
      let bestCompletion = -1;
      let bestDayKey = null;

      dailyKeys.forEach((key) => {
        const dayEntry = dailyMap.get(key);
        const completion = dayEntry.total
          ? Math.round((dayEntry.completed / dayEntry.total) * 100)
          : 0;

        if (completion > bestCompletion || (completion === bestCompletion && key > bestDayKey)) {
          bestCompletion = completion;
          bestDayKey = key;
        }
      });

      totals.bestDay = bestDayKey;

      let streak = 0;
      const earliestKey = dailyKeys[0];
      let cursor = normalizeDateInput(todayKey);
      const earliestDate = normalizeDateInput(earliestKey);

      while (cursor && earliestDate && cursor >= earliestDate) {
        const key = formatDateKey(cursor);
        const dayEntry = dailyMap.get(key);
        const completion = dayEntry && dayEntry.total
          ? Math.round((dayEntry.completed / dayEntry.total) * 100)
          : 0;

        if (completion > 50) {
          streak += 1;
          cursor.setUTCDate(cursor.getUTCDate() - 1);
        } else {
          break;
        }
      }

      totals.currentStreak = streak;

      if (!dailyMap.has(todayKey)) {
        totals.currentStreak = 0;
      }
    }

    return res.status(200).json(totals);
  } catch (error) {
    console.error("Error fetching progress stats:", error);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
};

const getProgressHeatmap = async (req, res) => {
  try {
    const monthParam = req.query.month;
    const targetMonth = monthParam || formatDateKey(new Date()).slice(0, 7);
    const range = buildMonthRange(targetMonth);

    if (!range) {
      return res.status(400).json({ message: "Invalid month format" });
    }

    const tasks = await Task.find({ date: { $gte: range.start, $lte: range.end } }).lean();
    const tasksByDay = new Map();

    tasks.forEach((task) => {
      const key = formatDateKey(task.date);
      if (!tasksByDay.has(key)) {
        tasksByDay.set(key, { total: 0, completed: 0 });
      }
      const entry = tasksByDay.get(key);
      entry.total += 1;
      if (task.status === "completed") {
        entry.completed += 1;
      }
    });

    const days = listUtcDays(range.start, range.end);
    const heatmap = days.map((day) => {
      const key = formatDateKey(day);
      const entry = tasksByDay.get(key) || { total: 0, completed: 0 };
      const value = entry.total
        ? Math.round((entry.completed / entry.total) * 100)
        : 0;

      return {
        date: key,
        value,
        taskCount: entry.total,
        completedCount: entry.completed,
      };
    });

    return res.status(200).json(heatmap);
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    return res.status(500).json({ message: "Failed to fetch heatmap" });
  }
};

const getWeeklySummary = async (req, res) => {
  try {
    const tasks = await Task.find().lean();
    const weeks = new Map();

    tasks.forEach((task) => {
      const date = new Date(task.date);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      const weekStart = getWeekStartUtc(date);
      const key = formatDateKey(weekStart);

      if (!weeks.has(key)) {
        weeks.set(key, {
          weekStart,
          total: 0,
          completed: 0,
          timeSpentTotal: 0,
          timeSpentCount: 0,
        });
      }

      const entry = weeks.get(key);
      entry.total += 1;
      if (task.status === "completed") {
        entry.completed += 1;
      }
      if (typeof task.timeSpent === "number" && Number.isFinite(task.timeSpent)) {
        entry.timeSpentTotal += task.timeSpent;
        entry.timeSpentCount += 1;
      }
    });

    const summary = Array.from(weeks.values())
      .sort((a, b) => a.weekStart - b.weekStart)
      .map((entry) => {
        const weekEnd = new Date(entry.weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

        const completionPercentage = entry.total
          ? Math.round((entry.completed / entry.total) * 100)
          : 0;

        const averageTimePerTask = entry.timeSpentCount
          ? Math.round(entry.timeSpentTotal / entry.timeSpentCount)
          : 0;

        return {
          weekStart: formatDateKey(entry.weekStart),
          weekEnd: formatDateKey(weekEnd),
          totalTasks: entry.total,
          completedTasks: entry.completed,
          completionPercentage,
          averageTimePerTask,
        };
      });

    return res.status(200).json(summary);
  } catch (error) {
    console.error("Error fetching weekly summary:", error);
    return res.status(500).json({ message: "Failed to fetch weekly summary" });
  }
};

const updateProgressManual = async (req, res) => {
  try {
    const { date, mood, notes } = req.body;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const normalizedDate = normalizeDateInput(date);
    if (!normalizedDate) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const updates = {};

    if (typeof mood !== "undefined") {
      const moodNumber = Number(mood);
      if (!Number.isInteger(moodNumber) || moodNumber < 1 || moodNumber > 5) {
        return res.status(400).json({ message: "Mood must be a number between 1 and 5" });
      }
      updates.mood = moodNumber;
    }

    if (typeof notes !== "undefined") {
      if (typeof notes !== "string") {
        return res.status(400).json({ message: "Notes must be a string" });
      }
      updates.notes = notes;
    }

    await DailyProgress.findOneAndUpdate(
      { date: normalizedDate },
      {
        $set: updates,
        $setOnInsert: { date: normalizedDate },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const updated = await updateDailyProgressForDate(normalizedDate);

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating daily progress:", error);
    return res.status(500).json({ message: "Failed to update daily progress" });
  }
};

module.exports = {
  getTodayProgress,
  getProgressRange,
  getProgressStats,
  getProgressHeatmap,
  getWeeklySummary,
  updateProgressManual,
};
