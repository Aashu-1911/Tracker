const express = require("express");
const {
  getTodayProgress,
  getProgressRange,
  getProgressStats,
  getProgressHeatmap,
  getWeeklySummary,
  updateProgressManual,
} = require("../controllers/progressController");

const router = express.Router();

router.get("/today", getTodayProgress);
router.get("/range", getProgressRange);
router.get("/stats", getProgressStats);
router.get("/heatmap", getProgressHeatmap);
router.get("/weekly", getWeeklySummary);
router.post("/update", updateProgressManual);

module.exports = router;
