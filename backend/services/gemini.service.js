// Owns Gemini client calls and the order-tool function-calling exchange.
const { GoogleGenAI } = require("@google/genai");
const { GEMINI_API_KEY, GEMINI_MODEL } = require("../config/env");
const policies = require("../config/policies.json");
const { buildSystemInstruction } = require("../prompts/system.prompt");
const { buildSummaryPrompt } = require("../prompts/summary.prompt");
const { get_order_details } = require("./orders.service");
const { tools } = require("../tools/orderTools");
const { fallbackSummary, parseSummaryResponse } = require("./summaryParser");

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const systemInstruction = buildSystemInstruction(policies.policies);

function isGeminiConfigured() {
  return Boolean(GEMINI_API_KEY);
}

async function generateChatReply(contents) {
  const firstResponse = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction,
      tools,
    },
  });

  const functionCalls = firstResponse.functionCalls || [];

  if (functionCalls.length === 0) {
    return {
      reply: firstResponse.text || "I'm sorry, could you please repeat that?",
      toolUsed: false,
    };
  }

  const functionResponses = functionCalls.map((call) => {
    if (call.name !== "get_order_details") {
      return {
        name: call.name,
        response: { error: "Unknown tool." },
      };
    }

    const order = get_order_details(call.args?.order_id);

    return {
      name: call.name,
      response: order
        ? { found: true, order }
        : {
            found: false,
            message: "Order not found. Ask the customer to verify the order ID.",
          },
    };
  });
  const orderCall = functionCalls.find((call) => call.name === "get_order_details");
  const orderResponse = functionResponses.find((item) => item.name === "get_order_details");

  const candidateContent = firstResponse.candidates?.[0]?.content;

  if (!candidateContent) {
    throw new Error("Gemini returned a tool call without candidate content.");
  }

  const secondResponse = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      ...contents,
      candidateContent,
      {
        role: "user",
        parts: functionResponses.map((item) => ({
          functionResponse: {
            name: item.name,
            response: item.response,
          },
        })),
      },
    ],
    config: {
      systemInstruction,
      tools,
    },
  });

  return {
    reply: secondResponse.text || "I'm sorry, I couldn't retrieve a clear answer.",
    toolUsed: true,
    toolName: "get_order_details",
    toolInput: { order_id: orderCall?.args?.order_id || null },
    toolResult: { found: Boolean(orderResponse?.response.found) },
  };
}

async function generateCallSummary(transcript) {
  const fallback = () => fallbackSummary(transcript);
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: JSON.stringify(transcript),
      config: {
        systemInstruction: buildSummaryPrompt(),
        responseMimeType: "application/json",
      },
    });

    return parseSummaryResponse(response.text || "", transcript);
  } catch (error) {
    if (error?.name === "SyntaxError") {
      return fallback();
    }
    throw error;
  }
}

module.exports = {
  isGeminiConfigured,
  generateChatReply,
  generateCallSummary,
};
