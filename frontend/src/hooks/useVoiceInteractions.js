// Connects browser recognition events to guarded chat requests and spoken replies.
import { useEffect, useRef } from "react";
import { CALL_STATUS, UNSUPPORTED_BROWSER_MESSAGE } from "../constants/callStatus";
import { createSpeechRecognition, getSpeechRecognition } from "../services/speech";
import { sendVoiceMessage } from "../services/voiceChat";

export function useVoiceInteractions({ setCallStatus, setError, addMessage, onPermissionDenied }) {
  const recognitionRef = useRef(null);
  const sessionIdRef = useRef(0);
  const activeRef = useRef(false);
  const busyRef = useRef(false);
  const historyRef = useRef([]);
  const permissionDeniedRef = useRef(onPermissionDenied);

  useEffect(() => {
    permissionDeniedRef.current = onPermissionDenied;
  }, [onPermissionDenied]);

  useEffect(
    () => () => {
      activeRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
      window.speechSynthesis?.cancel();
    },
    []
  );

  function startRecognition(sessionId) {
    if (!activeRef.current || busyRef.current || sessionId !== sessionIdRef.current) return;

    // Keep recognition paused during TTS to avoid transcribing speaker output as caller speech.
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError(UNSUPPORTED_BROWSER_MESSAGE);
      setCallStatus(CALL_STATUS.IDLE);
      activeRef.current = false;
      return;
    }

    const recognition = createSpeechRecognition(SpeechRecognition, {
      onStart: () => {
        if (sessionId === sessionIdRef.current && activeRef.current) {
          setCallStatus(CALL_STATUS.LISTENING);
        }
      },
      onResult: (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim();
        if (transcript) {
          void sendVoiceMessage(transcript, sessionId, {
            refs: {
              active: activeRef,
              busy: busyRef,
              history: historyRef,
              sessionId: sessionIdRef,
            },
            setCallStatus,
            setError,
            addMessage,
            startRecognition,
          });
        }
      },
      onError: (event) => {
        if (!activeRef.current || sessionId !== sessionIdRef.current) return;
        if (event.error === "not-allowed") {
          setError(
            "Microphone permission denied. Allow microphone access in your browser settings."
          );
          permissionDeniedRef.current();
        } else if (event.error === "no-speech") {
          setError("I couldn't hear you. Please try speaking again.");
        } else if (event.error !== "aborted") {
          setError(`Voice recognition error: ${event.error}`);
        }
      },
      onEnd: () => {
        recognitionRef.current = null;
        if (activeRef.current && !busyRef.current && sessionId === sessionIdRef.current) {
          window.setTimeout(() => startRecognition(sessionId), 300);
        }
      },
    });

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setError("Unable to start the microphone. Please try again.");
      permissionDeniedRef.current();
    }
  }

  function beginSession() {
    activeRef.current = false;
    busyRef.current = false;
    historyRef.current = [];
    return ++sessionIdRef.current;
  }

  function activateSession(sessionId) {
    if (sessionId !== sessionIdRef.current) return false;
    activeRef.current = true;
    return true;
  }

  function endSession() {
    sessionIdRef.current += 1;
    activeRef.current = false;
    busyRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition may already have stopped.
      }
      recognitionRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }

  return {
    beginSession,
    activateSession,
    isCurrentSession: (sessionId) => sessionId === sessionIdRef.current,
    isActive: () => activeRef.current,
    startRecognition,
    endSession,
  };
}
