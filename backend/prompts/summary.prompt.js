function buildSummaryPrompt() {
  return `Summarize this Aura Skincare customer support call as JSON with exactly these fields:
{
  "customer_intent": "ORDER_TRACKING | CANCELLATION | RETURN_REFUND | SHIPPING_INFO | COD_INFO | DAMAGED_PRODUCT | POLICY_QUERY | OUT_OF_SCOPE | OTHER",
  "order_id": "ORD-101 or null",
  "resolution_status": "RESOLVED | PARTIALLY_RESOLVED | UNRESOLVED",
  "call_summary": "One or two factual sentences."
}
Use only facts stated in the transcript. Do not invent facts or claim that an action was completed unless the transcript confirms it. Use null when no order ID is present. Return JSON only.`;
}

module.exports = { buildSummaryPrompt };
