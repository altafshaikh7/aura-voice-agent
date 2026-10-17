import { useState } from "react";
import { sampleOrders } from "../data/sampleOrders";
import { copyText } from "../services/clipboard";

const prompts = [
  "Where is ORD-101?",
  "Can I return ORD-102?",
  "Cancel ORD-103",
  "Cancel ORD-101",
  "What is your shipping fee?",
  "Book me a flight to Goa",
];

function TestOrdersPanel() {
  const [copiedValue, setCopiedValue] = useState("");
  const [copyError, setCopyError] = useState("");

  async function copy(value) {
    try {
      await copyText(value);
      setCopiedValue(value);
      setCopyError("");
      window.setTimeout(() => setCopiedValue(""), 1600);
    } catch {
      setCopyError("Copy failed. Please select and copy the text manually.");
    }
  }

  return (
    <article className="orders-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">QUICK TEST</span>
          <h2>Try an order</h2>
        </div>
        <span className="order-count">03 ORDERS</span>
      </div>

      <p className="muted">Sample orders for your demo.</p>

      <div className="order-list">
        {sampleOrders.map((order) => (
          <div className="order-item" key={order.id}>
            <span className="order-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="19"
                height="19"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 7.5 12 4l7 3.5v9L12 20l-7-3.5z" />
                <path d="m5 7.5 7 4 7-4M12 12v8" />
              </svg>
            </span>
            <span className="order-info">
              <strong>{order.id}</strong>
              <small>{order.customer}</small>
              <small>{order.product}</small>
              <small>
                {order.courier} · {order.trackingId} · {order.note}
              </small>
              <span className={`order-status ${order.statusClass}`}>{order.status}</span>
            </span>
            <span className="order-end">
              <span className="order-price">{order.amount}</span>
              <span className="order-arrow" aria-hidden="true">
                ↗
              </span>
            </span>
            <button
              className="copy-id-button"
              type="button"
              onClick={() => copy(order.id)}
              aria-label={`Copy order ID ${order.id}`}
            >
              {copiedValue === order.id ? "Copied" : "Copy ID"}
            </button>
          </div>
        ))}
      </div>

      <p className="suggestion-label">Try asking</p>
      <div className="prompt-list">
        {prompts.map((prompt) => (
          <button
            className="prompt-chip"
            type="button"
            key={prompt}
            onClick={() => copy(prompt)}
            aria-label={`Copy prompt: ${prompt}`}
          >
            {copiedValue === prompt ? "Copied" : prompt}
          </button>
        ))}
      </div>
      <p className="muted order-hint">Read a prompt aloud or select one to copy it.</p>
      {copyError && (
        <p className="copy-error" role="alert">
          {copyError}
        </p>
      )}
    </article>
  );
}

export default TestOrdersPanel;
