const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 30 } = {}) => {
  const store = new Map();

  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ message: "Too many requests" });
    }

    entry.count += 1;
    store.set(key, entry);
    return next();
  };
};

module.exports = { createRateLimiter };
