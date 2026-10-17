// Sends chat requests to the configured backend and validates its response.
import { API_URL } from "../config/env";

export async function sendChatMessage(message, history) {
  const response = await fetch(`${API_URL}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, history }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "The AI request failed.");
  }

  return {
    reply: data.reply,
    toolUsed: data.toolUsed,
    toolName: data.toolName,
    toolInput: data.toolInput,
    toolResult: data.toolResult,
  };
}

export async function getSummary(transcript) {
  const response = await fetch(`${API_URL}/api/ai/summary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transcript }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "The call summary could not be generated.");
  }

  return data.summary;
}
