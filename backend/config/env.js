require("dotenv").config();

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const configuredWindow = Number(process.env.RATE_LIMIT_WINDOW_MS);
const configuredMax = Number(process.env.RATE_LIMIT_MAX);
const RATE_LIMIT_WINDOW_MS =
  Number.isSafeInteger(configuredWindow) && configuredWindow > 0 ? configuredWindow : 60_000;
const RATE_LIMIT_MAX =
  Number.isSafeInteger(configuredMax) && configuredMax > 0 ? configuredMax : 30;
const TRUST_PROXY =
  process.env.TRUST_PROXY === undefined
    ? process.env.NODE_ENV === "production"
    : process.env.TRUST_PROXY === "1";
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  (process.env.NODE_ENV !== "production" ? "http://localhost:5173" : undefined);

module.exports = {
  PORT,
  GEMINI_API_KEY,
  GEMINI_MODEL,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  TRUST_PROXY,
  FRONTEND_URL,
};
