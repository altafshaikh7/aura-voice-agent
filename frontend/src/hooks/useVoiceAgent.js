// Manages call state, greeting, summary, and guarded voice-session lifecycle.
import { useState } from "react";
import { CALL_STATUS, GREETING } from "../constants/callStatus";
import { useCallSummary } from "./useCallSummary";
import { useVoiceInteractions } from "./useVoiceInteractions";
import { isVoiceSupported, requestMicrophoneAccess, speakText } from "../services/speech";

function toSummaryTranscript(messages) {
  return messages.map((message) => ({
    role: message.role === "You" ? "user" : message.role === "Aria" ? "model" : "system",
    text: message.text,
  }));
}

export function useVoiceAgent() {
  const [callStatus, setCallStatus] = useState(CALL_STATUS.IDLE);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [isSupported] = useState(() => isVoiceSupported());
  const callSummary = useCallSummary();

  function addMessage(role, text) {
    setMessages((previous) => [...previous, { role, text, id: `${Date.now()}-${Math.random()}` }]);
  }

  function endCall() {
    voice.endSession();
    setCallStatus(CALL_STATUS.ENDED);
    if (messages.some((message) => message.role === "You")) {
      void callSummary.requestSummary(toSummaryTranscript(messages));
    }
  }

  const voice = useVoiceInteractions({
    setCallStatus,
    setError,
    addMessage,
    onPermissionDenied: endCall,
  });

  async function startCall() {
    if (voice.isActive() || !isSupported) return;
    const sessionId = voice.beginSession();
    setError("");
    callSummary.resetSummary();

    try {
      await requestMicrophoneAccess();
      if (!voice.isCurrentSession(sessionId) || !voice.activateSession(sessionId)) return;

      setMessages([]);
      addMessage("Aria", GREETING);
      setCallStatus(CALL_STATUS.SPEAKING);
      await speakText(GREETING, () => voice.isCurrentSession(sessionId));
      if (voice.isCurrentSession(sessionId) && voice.isActive()) {
        voice.startRecognition(sessionId);
      }
    } catch (micError) {
      if (!voice.isCurrentSession(sessionId)) return;
      setError(
        micError.name === "NotAllowedError"
          ? "Please allow microphone access to start the call."
          : "Unable to access the microphone. Check your browser settings."
      );
      setCallStatus(CALL_STATUS.IDLE);
    }
  }

  function resetCall() {
    voice.endSession();
    setMessages([]);
    setError("");
    setCallStatus(CALL_STATUS.IDLE);
    callSummary.resetSummary();
  }

  return {
    callStatus,
    messages,
    error,
    isSupported,
    startCall,
    endCall,
    resetCall,
    ...callSummary,
  };
}
