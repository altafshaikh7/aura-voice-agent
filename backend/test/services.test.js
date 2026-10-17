const assert = require("node:assert/strict");
const test = require("node:test");
const { get_order_details } = require("../services/orders.service");
const {
  fallbackSummary,
  isValidTranscript,
  parseSummaryResponse,
} = require("../services/summaryParser");
const { handleGeminiError } = require("../utils/errorHandler");

test("order lookup preserves missing ID behavior and computes eligibility", () => {
  assert.equal(get_order_details(""), null);
  assert.equal(get_order_details("ORD-999"), null);

  const outForDelivery = get_order_details("ord-101");
  assert.equal(outForDelivery.returnEligible, false);
  assert.equal(outForDelivery.cancelEligible, false);
  assert.match(outForDelivery.cancelReason, /refuse delivery at the doorstep/i);
  assert.match(outForDelivery.returnReason, /unopened/i);
  assert.match(outForDelivery.returnReason, /unused/i);
  assert.match(outForDelivery.returnReason, /packaging/i);
  assert.match(outForDelivery.returnReason, /confirmed verbally/i);

  const delivered = get_order_details("ORD-102");
  assert.equal(delivered.deliveredDaysAgo, 14);
  assert.equal(delivered.returnEligible, false);
  assert.equal(delivered.cancelEligible, false);

  const processing = get_order_details("ORD-103");
  assert.equal(processing.cancelEligible, true);
});

test("summary transcript validation enforces size, roles, and text types", () => {
  assert.equal(isValidTranscript([{ role: "user", text: "Hello" }]), true);
  assert.equal(isValidTranscript([]), false);
  assert.equal(isValidTranscript([{ role: "assistant", text: "Hello" }]), false);
  assert.equal(isValidTranscript([{ role: "user", text: 42 }]), false);
  assert.equal(
    isValidTranscript(Array.from({ length: 101 }, () => ({ role: "user", text: "Hi" }))),
    false
  );
});

test("summary parser accepts fenced valid JSON and normalizes order IDs", () => {
  const transcript = [{ role: "user", text: "Where is ord-101?" }];
  const result = parseSummaryResponse(
    '```json\n{"customer_intent":"ORDER_TRACKING","order_id":"ord-101","resolution_status":"RESOLVED","call_summary":"Order ORD-101 is out for delivery."}\n```',
    transcript
  );
  assert.deepEqual(result, {
    customer_intent: "ORDER_TRACKING",
    order_id: "ORD-101",
    resolution_status: "RESOLVED",
    call_summary: "Order ORD-101 is out for delivery.",
  });
});

test("malformed or invalid summaries use the safe deterministic fallback", () => {
  const transcript = [{ role: "user", text: "Can you check ORD-999?" }];
  const fallback = fallbackSummary(transcript);
  assert.deepEqual(parseSummaryResponse("not JSON", transcript), fallback);
  assert.deepEqual(
    parseSummaryResponse(
      '{"customer_intent":"INVALID","order_id":null,"resolution_status":"RESOLVED","call_summary":"No."}',
      transcript
    ),
    fallback
  );
  assert.equal(fallback.order_id, "ORD-999");
  assert.equal(fallback.fallback, true);
});

test("Gemini error details are omitted from production responses", () => {
  const previousMode = process.env.NODE_ENV;
  const previousLogger = console.error;
  process.env.NODE_ENV = "production";
  console.error = () => {};

  const response = {
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  try {
    handleGeminiError(
      Object.assign(new Error("private provider response"), { status: 403, code: "PRIVATE" }),
      response
    );
    assert.equal(response.statusCode, 502);
    assert.deepEqual(Object.keys(response.body), ["success", "message"]);
  } finally {
    if (previousMode === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousMode;
    }
    console.error = previousLogger;
  }
});
