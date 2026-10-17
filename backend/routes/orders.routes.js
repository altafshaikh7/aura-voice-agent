// Exposes order lookup by order ID.
const express = require("express");
const { get_order_details } = require("../services/orders.service");

const router = express.Router();

router.get("/:orderId", (req, res) => {
  const order = get_order_details(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found. Please check your order ID.",
    });
  }

  return res.json({ success: true, order });
});

module.exports = router;
