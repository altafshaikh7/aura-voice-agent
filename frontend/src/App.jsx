
import { useState, useRef, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

const orders = [
  {
    id: "ORD-101",
    customer: "Priya Sharma",
    product: "Vitamin C Serum (30ml)",
    amount: "₹699",
    status: "Out for Delivery",
  },
  {
    id: "ORD-102",
    customer: "Rahul Verma",
    product: "Hydrating Sunscreen SPF 50",
    amount: "₹499",
    status: "Delivered",
  },
  {
    id: "ORD-103",
    customer: "Ananya Patel",
    product: "Green Tea Face Wash + Toner",
    amount: "₹850",
    status: "Processing",
  },
];

function App() {
  const [callStatus, setCallStatus] = useState("Idle");
  const [selectedOrder, setSelectedOrder] = useState("ORD-101");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const historyRef = useRef([]);
  const activeRef = useRef(false);
  const busyRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    setIsSupported(Boolean(SpeechRecognition));

    return () => {
      activeRef.current = false;

      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      window.speechSynthesis?.cancel();
    };
  }, []);

  function addMessage(role, text) {
    setMessages((previous) => [
      ...previous,
      {
        role,
        text,
        id: `${Date.now()}-${Math.random()}`,
      },
    ]);
  }

  function speak(text) {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onend = resolve;
      utterance.onerror = resolve;

      window.speechSynthesis.speak(utterance);
    });
  }

  function startRecognition() {
    if (!activeRef.current || busyRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice recognition is not supported in this browser. Please use the latest Google Chrome."
      );
      setCallStatus("Idle");
      activeRef.current = false;
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (activeRef.current) {
        setCallStatus("Listening");
      }
    };

    recognition.onresult = async (event) => {
      const transcript =
        event.results?.[0]?.[0]?.transcript?.trim();

      if (transcript && activeRef.current) {
        await sendMessage(transcript);
      }
    };

    recognition.onerror = (event) => {
      if (!activeRef.current) return;

      if (event.error === "not-allowed") {
        setError(
          "Microphone permission denied. Allow microphone access in your browser settings."
        );
        endCall();
        return;
      }

      if (event.error === "no-speech") {
        setError("I couldn't hear you. Please try speaking again.");
      } else if (event.error !== "aborted") {
        setError(`Voice recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;

      if (activeRef.current && !busyRef.current) {
        window.setTimeout(() => {
          if (activeRef.current && !busyRef.current) {
            startRecognition();
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      recognitionRef.current = null;
      setError("Unable to start the microphone. Please try again.");
    }
  }

  async function sendMessage(text) {
    if (!activeRef.current || busyRef.current) return;

    busyRef.current = true;
    setCallStatus("Thinking");
    setError("");
    addMessage("You", text);

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: historyRef.current,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "The AI request failed.");
      }

      const reply = data.reply;

      historyRef.current = [
        ...historyRef.current,
        { role: "user", parts: [{ text }] },
        { role: "model", parts: [{ text: reply }] },
      ].slice(-20);

      addMessage("Aria", reply);

      if (activeRef.current) {
        setCallStatus("Speaking");
        await speak(reply);
      }
    } catch (err) {
      const message =
        err.message ||
        "Unable to reach Aria. Please check the backend server.";

      setError(message);
      addMessage("System", message);
    } finally {
      busyRef.current = false;

      if (activeRef.current) {
        startRecognition();
      } else {
        setCallStatus("Ended");
      }
    }
  }

  async function startCall() {
    if (activeRef.current) return;

    setError("");

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError(
        "Please use Google Chrome on your computer for microphone recognition."
      );
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is unavailable.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      stream.getTracks().forEach((track) => track.stop());

      activeRef.current = true;
      busyRef.current = false;
      historyRef.current = [];
      setMessages([]);
      setError("");
      setCallStatus("Listening");

      startRecognition();
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Please allow microphone access to start the call."
          : "Unable to access the microphone. Check your browser settings."
      );
      setCallStatus("Idle");
    }
  }

  function endCall() {
    activeRef.current = false;
    busyRef.current = false;

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;

      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Recognition may already have stopped.
      }

      recognitionRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setCallStatus("Ended");
  }

  const statusText = {
    Idle: "Ready to connect",
    Listening: "Listening to you...",
    Thinking: "Aria is thinking...",
    Speaking: "Aria is speaking...",
    Ended: "Call ended",
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">a</span>

          <span className="brand-copy">
            <strong>Aura</strong>
            <small>SKINCARE</small>
          </span>
        </a>

        <div className="topbar-right">
          <span className="online-dot" />
          <span>AI Customer Support</span>
          <span className="agent-badge">ARIA AI</span>
        </div>
      </header>

      <main>
        <section className="welcome">
          <span className="eyebrow">
            YOUR PERSONAL SKINCARE ASSISTANT
          </span>

          <h1>
            Care that feels <em>personal.</em>
          </h1>

          <p>
            Meet Aria, your Aura Skincare assistant.
            Get help with orders, deliveries, returns,
            and skincare policies.
          </p>
        </section>

        <section className="dashboard">
          <article className="call-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">VOICE ASSISTANT</span>
                <h2>Talk to Aria</h2>
              </div>

              <span className="secure-label">
                <span className="online-dot" />
                Secure session
              </span>
            </div>

            <div className={`voice-orb ${callStatus.toLowerCase()}`}>
              <div className="orb-inner">
                <span className="orb-letter">a</span>
              </div>
            </div>

            <h3>Hi, I'm Aria.</h3>

            <p className="call-description">
              Your personal assistant for a better
              Aura Skincare experience.
            </p>

            <div className={`status-pill ${callStatus.toLowerCase()}`}>
              <span className="status-dot" />
              {statusText[callStatus]}
            </div>

            <div className="call-actions">
              <button
                className="start-button"
                disabled={
                  callStatus === "Listening" ||
                  callStatus === "Thinking" ||
                  callStatus === "Speaking"
                }
                onClick={startCall}
              >
                <span className="button-dot" />
                Start Call
              </button>

              <button
                className="end-button"
                disabled={callStatus === "Idle" || callStatus === "Ended"}
                onClick={endCall}
              >
                End Call
              </button>
            </div>

            <p className="privacy-note">
              {isSupported
                ? "Allow microphone access when prompted."
                : "Use the latest Google Chrome for voice recognition."}
            </p>

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
          </article>

          <div className="details-column">
            <article className="orders-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">QUICK TEST</span>
                  <h2>Try an order</h2>
                </div>

                <span className="order-count">03 ORDERS</span>
              </div>

              <p className="muted">
                Select a sample order for your demo.
              </p>

              <div className="order-list">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    className={`order-item ${
                      selectedOrder === order.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    <span className="order-icon">
                      <svg
                        viewBox="0 0 24 24"
                        width="19"
                        height="19"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <path d="M5 7.5 12 4l7 3.5v9L12 20l-7-3.5z" />
                        <path d="m5 7.5 7 4 7-4M12 12v8" />
                      </svg>
                    </span>

                    <span className="order-info">
                      <strong>{order.id}</strong>
                      <small>{order.customer}</small>
                      <small>{order.product}</small>
                    </span>

                    <span className="order-end">
                      <span className="order-price">{order.amount}</span>
                      <span className="order-arrow">↗</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="selected-order">
                <span>Selected order</span>
                <strong>{selectedOrder}</strong>

                <span className="selected-status">
                  {orders.find((order) => order.id === selectedOrder)?.status}
                </span>
              </div>

              <p className="muted order-hint">
                Ask Aria about an order by speaking its ID.
              </p>
            </article>

            <article className="transcript-card">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">CONVERSATION</span>
                  <h2>Call transcript</h2>
                </div>

                <span className="live-label">
                  <span className="online-dot" />
                  LIVE
                </span>
              </div>

              <div className="transcript-content">
                {messages.length === 0 ? (
                  <div className="empty-transcript">
                    <div className="transcript-symbol">Aa</div>
                    <strong>Your conversation starts here</strong>

                    <p>
                      Your questions and Aria's replies will
                      appear here during the call.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div className="message" key={message.id}>
                      <strong>{message.role}</strong>
                      <p>{message.text}</p>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer>
        <span>© 2026 Aura Skincare</span>
        <span>Thoughtful care. Simple support.</span>
      </footer>
    </div>
  );
}

export default App;
