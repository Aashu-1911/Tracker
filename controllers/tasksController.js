const mongoose = require("mongoose");
const crypto = require("crypto");
const Task = require("../models/Task");

const allowedCategories = ["work", "health", "personal", "learning", "other"];
const allowedPriorities = ["high", "medium", "low"];
const allowedStatuses = ["pending", "in-progress", "completed"];
const MAX_LIMIT = 100;

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

const parsePositiveNumber = (value) => {
  if (value === null || typeof value === "undefined" || value === "") {
    return { isValid: true, number: undefined };
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return { isValid: false, number: undefined };
  }

  return { isValid: true, number: numberValue };
};

const parseDateRange = (dateString) => buildUtcRange(dateString);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createTask = async (req, res) => {
  try {
    const { title, description, category, priority, date } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (priority && !allowedPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority" });
    }

    let taskDate;
    if (date) {
      const parsed = normalizeDateInput(date);
      if (!parsed) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      taskDate = parsed;
    }

    const task = await Task.create({
      taskId: crypto.randomUUID(),
      title: title.trim(),
      description,
      category,
      priority,
      date: taskDate,
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ message: "Failed to create task" });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const { date, status, category, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      filter.status = status;
    }

    if (category) {
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      filter.category = category;
    }

    if (date) {
      const range = parseDateRange(date);
      if (!range) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      filter.date = { $gte: range.start, $lte: range.end };
    }

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const limitNumber = Math.min(parsedLimit, MAX_LIMIT);
    const skip = (pageNumber - 1) * limitNumber;

    const [tasks, count] = await Promise.all([
      Task.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNumber),
      Task.countDocuments(filter),
    ]);

    return res.status(200).json({
      count,
      page: pageNumber,
      limit: limitNumber,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return res.status(500).json({ message: "Failed to fetch task" });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, timeSpent, description, priority, aiInsight } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (priority && !allowedPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid priority" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (status) {
      task.status = status;
    }

    if (typeof timeSpent !== "undefined") {
      const parsedTime = parsePositiveNumber(timeSpent);
      if (!parsedTime.isValid) {
        return res.status(400).json({ message: "Invalid timeSpent" });
      }
      task.timeSpent = parsedTime.number;
    }

    if (typeof description !== "undefined") {
      task.description = description;
    }

    if (typeof priority !== "undefined") {
      task.priority = priority;
    }

    if (typeof aiInsight !== "undefined") {
      task.aiInsight = aiInsight;
    }

    await task.save();

    return res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ message: "Failed to update task" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Failed to delete task" });
  }
};

const getTasksByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const range = parseDateRange(date);

    if (!range) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const tasks = await Task.find({ date: { $gte: range.start, $lte: range.end } });
    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks by date:", error);
    return res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeSpent } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.status = "completed";

    if (typeof timeSpent !== "undefined") {
      const parsedTime = parsePositiveNumber(timeSpent);
      if (!parsedTime.isValid) {
        return res.status(400).json({ message: "Invalid timeSpent" });
      }
      task.timeSpent = parsedTime.number;
    } else if (!task.timeSpent && task.createdAt) {
      const minutes = Math.round((Date.now() - task.createdAt.getTime()) / 60000);
      task.timeSpent = Math.max(0, minutes);
    }

    await task.save();

    return res.status(200).json(task);
  } catch (error) {
    console.error("Error completing task:", error);
    return res.status(500).json({ message: "Failed to complete task" });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByDate,
  completeTask,
};
