// Provides verified order lookup for API handlers and Gemini tool calls.
const orders = require("../data/orders.json");
const { policies } = require("../config/policies.json");

function get_order_details(order_id) {
  if (typeof order_id !== "string" || !order_id.trim()) {
    return null;
  }

  const order = orders[order_id.trim().toUpperCase()];

  if (!order) {
    return null;
  }

  const conditions = policies.returns.conditions.join("; ").toLowerCase();
  const packagingRequirement = `${conditions}. These conditions must be confirmed verbally.`;
  const returnEligible =
    order.status === "Delivered" &&
    Number.isFinite(order.deliveredDaysAgo) &&
    order.deliveredDaysAgo <= policies.returns.windowDays;

  let returnReason;
  if (order.status !== "Delivered") {
    returnReason = `This order has not been delivered yet. ${packagingRequirement}`;
  } else if (returnEligible) {
    returnReason = `This order is within the ${policies.returns.windowDays}-day return window. ${packagingRequirement}`;
  } else {
    returnReason = `This order was delivered ${order.deliveredDaysAgo} days ago, outside the ${policies.returns.windowDays}-day return window. ${packagingRequirement}`;
  }

  const cancelEligible = order.status === policies.cancellation.allowedStatus;
  let cancelReason;
  if (cancelEligible) {
    cancelReason = `This order is ${order.status} and is eligible for cancellation.`;
  } else {
    cancelReason = `This order is currently ${order.status} and is not eligible for cancellation.`;
    if (["Out for Delivery", "Shipped"].includes(order.status)) {
      cancelReason += " You may refuse delivery at the doorstep.";
    }
  }

  return { ...order, returnEligible, returnReason, cancelEligible, cancelReason };
}

module.exports = { get_order_details };
