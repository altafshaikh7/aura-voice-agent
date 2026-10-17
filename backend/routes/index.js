// Mounts all API route modules and the service health endpoint.
const express = require("express");
const { isGeminiConfigured } = require("../services/gemini.service");
const ordersRoutes = require("./orders.routes");
const policiesRoutes = require("./policies.routes");
const aiRoutes = require("./ai.routes");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Aura Skincare AI Voice Agent API is running",
    geminiConfigured: isGeminiConfigured(),
  });
});

router.use("/api/orders", ordersRoutes);
router.use("/api/policies", policiesRoutes);
router.use("/api/ai", aiRoutes);

module.exports = router;
