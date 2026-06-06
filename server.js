require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/mongodb");
const taskRoutes = require("./routes/tasks");
const progressRoutes = require("./routes/progress");
const aiRoutes = require("./routes/ai");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Tracker API running" });
});

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const port = process.env.PORT || 5000;

const { getAiStatus } = require("./utils/aiClient");

connectDB()
  .then(() => {
    const aiStatus = getAiStatus();

    if (aiStatus.configured) {
      console.log(`AI ready (${aiStatus.providers.join(", ")})`);
    } else {
      console.warn(
        "AI not configured — set GEMINI_API_KEY or OPENAI_API_KEY"
      );
    }

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
