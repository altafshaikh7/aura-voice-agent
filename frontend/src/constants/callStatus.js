export const CALL_STATUS = {
  IDLE: "Idle",
  LISTENING: "Listening",
  THINKING: "Thinking",
  SPEAKING: "Speaking",
  ENDED: "Ended",
};

export const GREETING =
  "Namaste! I'm Aria, Aura Skincare's AI assistant. How can I help you today?";

export const UNSUPPORTED_BROWSER_MESSAGE =
  "Voice calls need Google Chrome or Microsoft Edge on desktop";

export const STATUS_TEXT = {
  [CALL_STATUS.IDLE]: "Ready to connect",
  [CALL_STATUS.LISTENING]: "Listening to you...",
  [CALL_STATUS.THINKING]: "Aria is thinking...",
  [CALL_STATUS.SPEAKING]: "Aria is speaking...",
  [CALL_STATUS.ENDED]: "Call ended",
};
