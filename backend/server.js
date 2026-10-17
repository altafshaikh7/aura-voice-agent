
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const orders = require("./data/orders.json");
const policies = require("./config/policies.json");

const app = express();
const PORT = process.env.PORT || 5000;

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL = "gemini-3.8-flash";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const systemInstruction = `
You are Aria, the AI customer support agent for Aura Skincare.

Be friendly, professional, concise, and natural in Indian English.
Ask for clarification when information is unclear.
Never invent order details, policies, or actions.
Use get_order_details for order-specific questions.
Never claim an order was cancelled or modified because this system
only reads order details.

Brand policies:
${JSON.stringify(policies.policies, null, 2)}

Available mock orders: ORD-101, ORD-102, ORD-103.
If an order is not found, ask the customer to verify its ID.
Keep replies short and suitable for spoken conversation.
`;

function get_order_details(order_id) {
  if (typeof order_id !== "string" || !order_id.trim()) {
    return null;
  }

  return orders[order_id.trim().toUpperCase()] || null;
}

function handleGeminiError(error, res) {
  console.error("Gemini API error:", error);

  const status = Number(error?.status || error?.code);
  let message = "Gemini request failed.";

  if (status === 400) {
    message = "Gemini rejected the request. Check the request configuration.";
  } else if (status === 401 || status === 403) {
    message = "Gemini authentication or permission error.";
  } else if (status === 404) {
    message = "Gemini model or API resource was not found.";
  } else if (status === 429) {
    message = "Gemini quota or rate limit reached.";
  } else if (
    ["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT"].includes(error?.code)
  ) {
    message = "Could not connect to Gemini. Check your network.";
  }

  return res.status(502).json({
    success: false,
    message,
    errorName: error?.name || "UnknownError",
    errorMessage: error?.message || "No detailed error message available",
    errorStatus: error?.status || null,
    errorCode: error?.code || null
  });
}

const tools = [
  {
    functionDeclarations: [
      {
        name: "get_order_details",
        description:
          "Look up verified Aura Skincare order details using the customer's order ID.",
        parameters: {
          type: "OBJECT",
          properties: {
            order_id: {
              type: "STRING",
              description: "Order ID, for example ORD-101"
            }
          },
          required: ["order_id"]
        }
      }
    ]
  }
];

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Aura Skincare AI Voice Agent API is running",
    geminiConfigured: Boolean(apiKey)
  });
});

app.get("/api/orders/:orderId", (req, res) => {
  const order = get_order_details(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found. Please check your order ID."
    });
  }

  return res.json({ success: true, order });
});

app.get("/api/policies", (req, res) => {
  return res.json({
    success: true,
    brand: policies.brand,
    agentName: policies.agentName,
    persona: policies.persona,
    policies: policies.policies
  });
});

app.post("/api/ai/test", async (req, res) => {
  if (!ai) {
    return res.status(500).json({
      success: false,
      message: "GEMINI_API_KEY is missing from backend/.env."
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: "Introduce yourself as Aria from Aura Skincare in one short sentence.",
      config: { systemInstruction }
    });

    return res.json({
      success: true,
      reply: response.text ||
        "Hello! I'm Aria from Aura Skincare. How can I help you today?"
    });
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

app.post("/api/ai/chat", async (req, res) => {
  if (!ai) {
    return res.status(500).json({
      success: false,
      message: "GEMINI_API_KEY is missing from backend/.env."
    });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a message."
      });
    }

    if (!Array.isArray(history)) {
      return res.status(400).json({
        success: false,
        message: "Conversation history must be an array."
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

    const contents = [
      ...validHistory,
      { role: "user", parts: [{ text: message.trim() }] }
    ];

    const firstResponse = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { systemInstruction, tools }
    });

    const functionCalls = firstResponse.functionCalls || [];

    if (functionCalls.length === 0) {
      return res.json({
        success: true,
        reply: firstResponse.text ||
          "I'm sorry, could you please repeat that?",
        toolUsed: false
      });
    }

    const functionResponses = functionCalls.map((call) => {
      if (call.name !== "get_order_details") {
        return {
          name: call.name,
          response: { error: "Unknown tool." }
        };
      }

      const order = get_order_details(call.args?.order_id);

      return {
        name: call.name,
        response: order
          ? { found: true, order }
          : {
              found: false,
              message: "Order not found. Ask the customer to verify the order ID."
            }
      };
    });

    const candidateContent = firstResponse.candidates?.[0]?.content;

    if (!candidateContent) {
      throw new Error("Gemini returned a tool call without candidate content.");
    }

    const secondResponse = await ai.models.generateContent({
      model: MODEL,
      contents: [
        ...contents,
        candidateContent,
        {
          role: "user",
          parts: functionResponses.map((item) => ({
            functionResponse: {
              name: item.name,
              response: item.response
            }
          }))
        }
      ],
      config: { systemInstruction, tools }
    });

    return res.json({
      success: true,
      reply: secondResponse.text ||
        "I'm sorry, I couldn't retrieve a clear answer.",
      toolUsed: true,
      toolName: "get_order_details"
    });
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found."
  });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    success: false,
    message: "An unexpected server error occurred."
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing from backend/.env");
  }
});
