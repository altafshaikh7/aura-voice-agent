import { useState } from "react";
import { copyText } from "../services/clipboard";
import ErrorBanner from "./ErrorBanner";

function CallSummary({ messages, summary, summaryLoading, summaryError, retrySummary, resetCall }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  async function copyJson() {
    try {
      await copyText(JSON.stringify(summary, null, 2));
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopyError("Copy failed. Please select and copy the JSON manually.");
    }
  }

  return (
    <article className="summary-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CALL COMPLETE</span>
          <h2>Call summary</h2>
        </div>
      </div>

      <div className="summary-transcript" aria-live="polite">
        {messages.map((message) =>
          message.role === "tool" ? (
            <span className="tool-chip" key={message.id}>
              {message.text}
            </span>
          ) : (
            <div className={`summary-message ${message.role.toLowerCase()}`} key={message.id}>
              <strong>{message.role}</strong>
              <p>{message.text}</p>
            </div>
          )
        )}
      </div>

      {summaryLoading && (
        <p className="summary-loading" role="status">
          Generating call summary...
        </p>
      )}
      {summaryError && <ErrorBanner message={summaryError} onRetry={retrySummary} />}
      {!summaryLoading && !summary && !summaryError && (
        <p className="muted">No customer conversation to summarize.</p>
      )}

      {summary && (
        <section className="outcome-card" aria-label="Structured call outcome">
          <div className="outcome-badges">
            <span className="outcome-badge">{summary.customer_intent}</span>
            <span className="outcome-badge">{summary.resolution_status}</span>
          </div>
          {summary.order_id && <p className="summary-order">Order: {summary.order_id}</p>}
          <p>{summary.call_summary}</p>
          {summary.fallback && (
            <p className="summary-fallback">
              A factual summary was unavailable; this is a safe fallback.
            </p>
          )}
          <div className="json-heading">
            <strong>Summary JSON</strong>
            <button type="button" className="secondary-button" onClick={copyJson}>
              {copied ? "Copied" : "Copy JSON"}
            </button>
          </div>
          <pre className="summary-json">{JSON.stringify(summary, null, 2)}</pre>
          {copyError && (
            <p className="copy-error" role="alert">
              {copyError}
            </p>
          )}
        </section>
      )}

      <button type="button" className="start-button new-call-button" onClick={resetCall}>
        Start New Call
      </button>
    </article>
  );
}

export default CallSummary;
