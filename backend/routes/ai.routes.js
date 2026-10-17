// Exposes Gemini chat and post-call summary endpoints.
const express = require("express");
const { handleGeminiError } = require("../utils/errorHandler");
const {
  generateChatReply,
  generateCallSummary,
  isGeminiConfigured,
} = require("../services/gemini.service");
const { isValidTranscript } = require("../services/summaryParser");

const router = express.Router();

function missingApiKey(res) {
  return res.status(500).json({
    success: false,
    message: "GEMINI_API_KEY is missing from backend/.env.",
  });
}

router.post("/chat", async (req, res) => {
  if (!isGeminiConfigured()) {
    return missingApiKey(res);
  }

  try {
    const { message, history = [] } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a message.",
      });
    }

    if (!Array.isArray(history)) {
      return res.status(400).json({
        success: false,
        message: "Conversation history must be an array.",
      });
    }

    const validHistory = history
      .filter(
        (item) =>
          item &&
          ["user", "model"].includes(item.role) &&
          Array.isArray(item.parts) &&
          item.parts.every((part) => part && typeof part.text === "string")
      )
      .slice(-20);

    const contents = [...validHistory, { role: "user", parts: [{ text: message.trim() }] }];

    const result = await generateChatReply(contents);
    return res.json({ success: true, ...result });
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

router.post("/summary", async (req, res) => {
  const { transcript } = req.body || {};
  if (!isValidTranscript(transcript)) {
    return res.status(400).json({
      success: false,
      message:
        "Transcript must contain 1-100 messages with role user, model, or system and string text.",
    });
  }

  if (!isGeminiConfigured()) {
    return missingApiKey(res);
  }

  try {
    const summary = await generateCallSummary(
      transcript.map(({ role, text }) => ({ role, text: text.slice(0, 1000) }))
    );
    return res.json({ success: true, summary });
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

module.exports = router;
