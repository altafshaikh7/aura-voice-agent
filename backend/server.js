const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const {
  PORT,
  FRONTEND_URL,
  GEMINI_API_KEY,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  TRUST_PROXY,
} = require("./config/env");
const routes = require("./routes");
const { notFoundHandler, errorMiddleware } = require("./utils/errorHandler");

const app = express();

if (TRUST_PROXY) {
  // Trust one hosting proxy hop so rate limiting can use the client IP.
  app.set("trust proxy", 1);
}

const allowedOrigins = (FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(
  "/api/ai",
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        success: false,
        message: "Too many AI requests. Please try again shortly.",
      }),
  })
);
app.use(routes);
app.use(notFoundHandler);
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing from backend/.env");
  }
});
