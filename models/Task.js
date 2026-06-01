const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
    category: {
      type: String,
      enum: ["work", "health", "personal", "learning", "other"],
      default: "other",
      index: true,
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
      index: true,
    },
    completedAt: {
      type: Date,
    },
    timeSpent: {
      type: Number,
      min: 0,
    },
    aiInsight: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.pre("save", function handleCompletionState(next) {
  if (this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }

  if (this.status !== "completed") {
    this.completedAt = undefined;
  }

  next();
});

taskSchema.methods.getCompletionStatus = function getCompletionStatus() {
  return {
    status: this.status,
    completedAt: this.completedAt || null,
  };
};

taskSchema.statics.getTasksByDate = function getTasksByDate(date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  return this.find({ date: { $gte: start, $lte: end } });
};

module.exports = mongoose.model("Task", taskSchema);
