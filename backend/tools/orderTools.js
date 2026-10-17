const functionDeclarations = [
  {
    name: "get_order_details",
    description:
      "Look up verified Aura Skincare order details using the customer's order ID. Use this whenever the customer asks about a specific order.",
    parameters: {
      type: "OBJECT",
      properties: {
        order_id: {
          type: "STRING",
          description:
            "The clearly provided order ID, for example ORD-101. Do not guess an unclear order ID.",
        },
      },
      required: ["order_id"],
    },
  },
];

const tools = [{ functionDeclarations }];

module.exports = { functionDeclarations, tools };
