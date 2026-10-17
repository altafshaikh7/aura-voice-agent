// Owns post-call summary loading, retries, errors, and reset behavior.
import { useRef, useState } from "react";
import { getSummary } from "../services/api";

export function useCallSummary() {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const transcriptRef = useRef([]);
  const requestIdRef = useRef(0);

  async function requestSummary(transcript) {
    const boundedTranscript = transcript.slice(-100);
    transcriptRef.current = boundedTranscript;
    const requestId = ++requestIdRef.current;
    setSummaryLoading(true);
    setSummaryError("");

    try {
      const result = await getSummary(boundedTranscript);
      if (requestId === requestIdRef.current) setSummary(result);
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setSummaryError(error.message || "The call summary could not be generated.");
      }
    } finally {
      if (requestId === requestIdRef.current) setSummaryLoading(false);
    }
  }

  function retrySummary() {
    return requestSummary(transcriptRef.current);
  }

  function resetSummary() {
    requestIdRef.current += 1;
    transcriptRef.current = [];
    setSummary(null);
    setSummaryLoading(false);
    setSummaryError("");
  }

  return {
    summary,
    summaryLoading,
    summaryError,
    requestSummary,
    retrySummary,
    resetSummary,
  };
}
