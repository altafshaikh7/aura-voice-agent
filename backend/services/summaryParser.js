// Validates Gemini summary JSON and supplies a deterministic safe fallback.
const CUSTOMER_INTENTS = new Set([
  "ORDER_TRACKING",
  "CANCELLATION",
  "RETURN_REFUND",
  "SHIPPING_INFO",
  "COD_INFO",
  "DAMAGED_PRODUCT",
  "POLICY_QUERY",
  "OUT_OF_SCOPE",
  "OTHER",
]);

const RESOLUTION_STATUSES = new Set(["RESOLVED", "PARTIALLY_RESOLVED", "UNRESOLVED"]);

function isValidTranscript(transcript) {
  return (
    Array.isArray(transcript) &&
    transcript.length >= 1 &&
    transcript.length <= 100 &&
    transcript.every(
      (item) =>
        item && ["user", "model", "system"].includes(item.role) && typeof item.text === "string"
    )
  );
}

function fallbackSummary(transcript) {
  const text = transcript.map((message) => message.text).join("\n");
  const orderId = text.match(/ORD-\d+/i)?.[0]?.toUpperCase() || null;

  return {
    customer_intent: "OTHER",
    order_id: orderId,
    resolution_status: "UNRESOLVED",
    call_summary: "The call summary could not be generated from the available transcript.",
    fallback: true,
  };
}

function parseSummaryResponse(raw, transcript) {
  const jsonText = (typeof raw === "string" ? raw : "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const result = JSON.parse(jsonText);
    const valid =
      result &&
      CUSTOMER_INTENTS.has(result.customer_intent) &&
      RESOLUTION_STATUSES.has(result.resolution_status) &&
      (result.order_id === null ||
        (typeof result.order_id === "string" && /^ORD-\d+$/i.test(result.order_id))) &&
      typeof result.call_summary === "string" &&
      result.call_summary.trim().length > 0;

    if (!valid) {
      return fallbackSummary(transcript);
    }

    return {
      customer_intent: result.customer_intent,
      order_id: result.order_id?.toUpperCase() || null,
      resolution_status: result.resolution_status,
      call_summary: result.call_summary.trim(),
    };
  } catch {
    return fallbackSummary(transcript);
  }
}

module.exports = { fallbackSummary, isValidTranscript, parseSummaryResponse };
