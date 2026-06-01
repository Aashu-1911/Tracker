const mongoose = require("mongoose");
const Task = require("../models/Task");
const DailyProgress = require("../models/DailyProgress");
const {
  allowedCategories,
  buildUtcRange,
  formatDateKey,
  listUtcDays,
  computeDailyMetrics,
} = require("../utils/progress");
const { DEFAULT_SYSTEM_PROMPT, generateAiResponse } = require("../utils/aiClient");

const chatHistory = new Map();
const MAX_HISTORY = 10;
const MAX_TASKS = 50;

const buildRangeFromInputs = (date, startDate, endDate) => {
  if (date) {
    return buildUtcRange(date);
  }

  if (!startDate || !endDate) {
    return null;
  }

  const startRange = buildUtcRange(startDate);
  const endRange = buildUtcRange(endDate);

  if (!startRange || !endRange || startRange.start > endRange.end) {
    return null;
  }

  return { start: startRange.start, end: endRange.end };
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const buildCategoryBreakdown = (tasks) => {
  const breakdown = {};
  allowedCategories.forEach((category) => {
    breakdown[category] = { total: 0, completed: 0 };
  });

  tasks.forEach((task) => {
    const category = allowedCategories.includes(task.category) ? task.category : "other";
    breakdown[category].total += 1;
    if (task.status === "completed") {
      breakdown[category].completed += 1;
    }
  });

  return breakdown;
};

const buildProgressTrend = async () => {
  const recent = await DailyProgress.find().sort({ date: -1 }).limit(7).lean();
  return recent
    .map((entry) => ({
      date: formatDateKey(entry.date),
      completionPercentage: entry.completionPercentage || 0,
      completedTasks: entry.completedTasks || 0,
      totalTasks: entry.totalTasks || 0,
    }))
    .reverse();
};

const formatTaskDetails = (tasks) =>
  tasks
    .map((task) => {
      const lines = [
        `- ${task.title}`,
        `  status: ${task.status}`,
        `  category: ${task.category || "other"}`,
      ];

      if (task.description) {
        lines.push(`  description: ${task.description}`);
      }
      if (typeof task.timeSpent === "number") {
        lines.push(`  time spent: ${task.timeSpent} minutes`);
      }

      return lines.join("\n");
    })
    .join("\n");

const buildInsightPrompt = async ({ tasks, context }) => {
  const metrics = computeDailyMetrics(tasks);
  const breakdown = buildCategoryBreakdown(tasks);
  const trend = await buildProgressTrend();

  const breakdownLines = Object.entries(breakdown)
    .map(([category, value]) => `${category}: ${value.completed}/${value.total}`)
    .join("\n");

  const trendLines = trend.length
    ? trend.map((entry) => `${entry.date}: ${entry.completionPercentage}%`).join("\n")
    : "No recent trend data.";

  return [
    "Task summary:",
    formatTaskDetails(tasks),
    "",
    `Totals: ${metrics.completedTasks}/${metrics.totalTasks} completed (${metrics.completionPercentage}%).`,
    "",
    "Category breakdown:",
    breakdownLines,
    "",
    "Progress trend (last 7 days):",
    trendLines,
    context ? "\nAdditional context:\n" + context : "",
  ].join("\n");
};

const getTasksForInsight = async ({ taskIds, date, startDate, endDate }) => {
  if (taskIds && taskIds.length > 0) {
    const idFilters = taskIds.map((id) => String(id));
    const objectIds = idFilters.filter((id) => isValidObjectId(id));
    const taskIdValues = idFilters.filter((id) => !isValidObjectId(id));

    const query = {
      $or: [{ _id: { $in: objectIds } }, { taskId: { $in: taskIdValues } }],
    };

    return Task.find(query).lean();
  }

  const range = buildRangeFromInputs(date, startDate, endDate);
  if (!range) {
    return null;
  }

  const days = listUtcDays(range.start, range.end);
  if (days.length > 93) {
    return false;
  }

  return Task.find({ date: { $gte: range.start, $lte: range.end } }).lean();
};

const generateInsights = async (req, res) => {
  try {
    const { taskIds, date, startDate, endDate, context } = req.body;

    if ((!taskIds || taskIds.length === 0) && !date && !(startDate && endDate)) {
      return res.status(400).json({ message: "taskIds, date, or date range is required" });
    }

    if (taskIds && !Array.isArray(taskIds)) {
      return res.status(400).json({ message: "taskIds must be an array" });
    }

    if (taskIds && taskIds.length > MAX_TASKS) {
      return res.status(400).json({ message: "Too many taskIds" });
    }

    if (context && typeof context !== "string") {
      return res.status(400).json({ message: "context must be a string" });
    }

    const tasks = await getTasksForInsight({ taskIds, date, startDate, endDate });
    if (!tasks) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    if (tasks === false) {
      return res.status(400).json({ message: "Date range too large" });
    }

    if (!tasks.length) {
      return res.status(404).json({ message: "No tasks found" });
    }

    const prompt = await buildInsightPrompt({ tasks, context });

    const generalInsight = await generateAiResponse({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const taskIdsToUpdate = tasks.map((task) => task._id);

    await Task.updateMany(
      { _id: { $in: taskIdsToUpdate } },
      { $set: { aiInsight: generalInsight } }
    );

    const updatedTasks = await Task.find({ _id: { $in: taskIdsToUpdate } });

    return res.status(200).json({
      tasks: updatedTasks,
      generalInsight,
      scope: {
        date: date || null,
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    const status = error.response && error.response.status === 429 ? 429 : 503;
    return res.status(status).json({
      message: "AI service unavailable. Please try again later.",
    });
  }
};

const appendHistory = (key, role, content) => {
  const history = chatHistory.get(key) || [];
  const updated = [...history, { role, content }].slice(-MAX_HISTORY);
  chatHistory.set(key, updated);
  return updated;
};

const chatWithAi = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "message is required" });
    }

    if (context && !Array.isArray(context)) {
      return res.status(400).json({ message: "context must be an array" });
    }

    const key = req.ip || "chat";
    const history = appendHistory(key, "user", message);

    const contextLines = Array.isArray(context)
      ? context
          .map((task) => {
            if (!task || typeof task !== "object") {
              return "";
            }
            const title = task.title || "Untitled";
            const status = task.status || "unknown";
            return `- ${title} (${status})`;
          })
          .filter(Boolean)
          .join("\n")
      : "";

    const prompt = [
      message,
      contextLines ? "\nContext tasks:\n" + contextLines : "",
    ].join("\n");

    const response = await generateAiResponse({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      messages: [...history, { role: "user", content: prompt }],
    });

    appendHistory(key, "assistant", response);

    return res.status(200).json({ response });
  } catch (error) {
    console.error("Error in AI chat:", error);
    const status = error.response && error.response.status === 429 ? 429 : 503;
    return res.status(status).json({
      message: "AI service unavailable. Please try again later.",
    });
  }
};

const clearChatHistory = async (req, res) => {
  const key = req.ip || "chat";
  chatHistory.delete(key);
  return res.status(200).json({ message: "Chat history cleared" });
};

module.exports = {
  generateInsights,
  chatWithAi,
  clearChatHistory,
};
