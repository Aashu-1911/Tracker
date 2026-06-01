const express = require("express");
const { generateInsights, chatWithAi } = require("../controllers/aiController");
const { createRateLimiter } = require("../utils/rateLimiter");

const router = express.Router();

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });

router.post("/generate-insights", limiter, generateInsights);
router.post("/chat", limiter, chatWithAi);

module.exports = router;
