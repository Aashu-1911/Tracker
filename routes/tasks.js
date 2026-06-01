const express = require("express");
const {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByDate,
  completeTask,
} = require("../controllers/tasksController");

const router = express.Router();

router.post("/", createTask);
router.get("/", getAllTasks);
router.get("/date/:date", getTasksByDate);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.patch("/:id/complete", completeTask);

module.exports = router;
