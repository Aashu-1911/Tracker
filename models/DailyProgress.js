const mongoose = require("mongoose");

const dailyProgressSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    completedTasks: {
      type: Number,
      default: 0,
      min: 0,
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

dailyProgressSchema.index({ sessionId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyProgress", dailyProgressSchema);
