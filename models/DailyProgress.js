const mongoose = require("mongoose");

const dailyProgressSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    totalTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tasksPerCategory: {
      type: Map,
      of: Number,
      default: () => ({
        work: 0,
        health: 0,
        personal: 0,
        learning: 0,
        other: 0,
      }),
    },
    averageTimePerTask: {
      type: Number,
      default: 0,
      min: 0,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    mood: {
      type: Number,
      min: 1,
      max: 5,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

dailyProgressSchema.methods.calculateProgress = function calculateProgress() {
  if (this.totalTasks <= 0) {
    this.completionPercentage = 0;
    return this.completionPercentage;
  }

  this.completionPercentage = Math.round(
    (this.completedTasks / this.totalTasks) * 100
  );

  return this.completionPercentage;
};

module.exports = mongoose.model("DailyProgress", dailyProgressSchema);
