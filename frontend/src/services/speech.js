// Wraps browser speech recognition, microphone permission, and synthesis APIs.
export function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

export function isVoiceSupported() {
  const userAgent = window.navigator.userAgent;
  const isDesktopChromeOrEdge =
    /(?:Chrome|Edg)\//.test(userAgent) && !/(?:Android|iPhone|iPad|Mobile)/i.test(userAgent);
  return Boolean(getSpeechRecognition()) && isDesktopChromeOrEdge;
}

export function createSpeechRecognition(SpeechRecognition, handlers) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = handlers.onStart;
  recognition.onresult = handlers.onResult;
  recognition.onerror = handlers.onError;
  recognition.onend = handlers.onEnd;
  return recognition;
}

function waitForVoices(synthesis) {
  const voices = synthesis.getVoices();
  const preferred = voices.find((voice) => /^en[-_]IN$/i.test(voice.lang));
  if (preferred || !synthesis.addEventListener) {
    return Promise.resolve(preferred || null);
  }

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => finish(null), 500);
    function finish(voice) {
      window.clearTimeout(timeout);
      synthesis.removeEventListener("voiceschanged", onChanged);
      resolve(voice);
    }
    function onChanged() {
      const available = synthesis.getVoices();
      finish(available.find((voice) => /^en[-_]IN$/i.test(voice.lang)) || null);
    }
    synthesis.addEventListener("voiceschanged", onChanged, { once: true });
  });
}

export async function speakText(text, isCurrent) {
  if (!("speechSynthesis" in window) || !isCurrent()) return;

  const synthesis = window.speechSynthesis;
  const voice = await waitForVoices(synthesis);
  if (!isCurrent()) return;

  synthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 1;
  utterance.pitch = 1;
  if (voice) utterance.voice = voice;

  await new Promise((resolve) => {
    utterance.onend = resolve;
    utterance.onerror = resolve;
    synthesis.speak(utterance);
  });
}

export async function requestMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is unavailable.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}
