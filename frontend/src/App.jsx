import { useVoiceAgent } from "./hooks/useVoiceAgent";
import Header from "./components/Header";
import CallCard from "./components/CallCard";
import TestOrdersPanel from "./components/TestOrdersPanel";
import Transcript from "./components/Transcript";
import CallSummary from "./components/CallSummary";
import "./styles/variables.css";
import "./styles/base.css";
import "./styles/components.css";

function App() {
  const {
    callStatus,
    messages,
    error,
    isSupported,
    startCall,
    endCall,
    resetCall,
    summary,
    summaryLoading,
    summaryError,
    retrySummary,
  } = useVoiceAgent();

  return (
    <div className="app-shell">
      <Header />

      <main>
        <section className="welcome">
          <span className="eyebrow">YOUR PERSONAL SKINCARE ASSISTANT</span>

          <h1>
            Care that feels <em>personal.</em>
          </h1>

          <p>
            Meet Aria, your Aura Skincare assistant. Get help with orders, deliveries, returns, and
            skincare policies.
          </p>
        </section>

        <section className="dashboard">
          <CallCard
            callStatus={callStatus}
            isSupported={isSupported}
            error={error}
            startCall={startCall}
            endCall={endCall}
          />

          <div className="details-column">
            <TestOrdersPanel />
            {callStatus === "Ended" ? (
              <CallSummary
                messages={messages}
                summary={summary}
                summaryLoading={summaryLoading}
                summaryError={summaryError}
                retrySummary={retrySummary}
                resetCall={resetCall}
              />
            ) : (
              <Transcript messages={messages} />
            )}
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
