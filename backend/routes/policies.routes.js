// Exposes the configured brand persona and policies.
const express = require("express");
const policies = require("../config/policies.json");

const router = express.Router();

router.get("/", (req, res) => {
  return res.json({
    success: true,
    brand: policies.brand,
    agentName: policies.agentName,
    persona: policies.persona,
    policies: policies.policies,
  });
});

module.exports = router;
