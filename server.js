require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/mongodb");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Tracker API running" });
});

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server due to DB connection error:", error);
    process.exit(1);
  });
