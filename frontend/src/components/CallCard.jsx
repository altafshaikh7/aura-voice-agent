import { CALL_STATUS, STATUS_TEXT } from "../constants/callStatus";
import ErrorBanner from "./ErrorBanner";

function CallCard({ callStatus, isSupported, error, startCall, endCall }) {
  return (
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
        Your personal assistant for a better Aura Skincare experience.
      </p>

      <div className={`status-pill ${callStatus.toLowerCase()}`} aria-live="polite">
        <span className="status-dot" />
        {STATUS_TEXT[callStatus]}
      </div>

      <div className="call-actions">
        <button
          className="start-button"
          disabled={
            !isSupported ||
            callStatus === CALL_STATUS.LISTENING ||
            callStatus === CALL_STATUS.THINKING ||
            callStatus === CALL_STATUS.SPEAKING
          }
          onClick={startCall}
        >
          <span className="button-dot" />
          Start Call
        </button>

        <button
          className="end-button"
          disabled={callStatus === CALL_STATUS.IDLE || callStatus === CALL_STATUS.ENDED}
          onClick={endCall}
        >
          End Call
        </button>
      </div>

      <p className="privacy-note">
        {isSupported
          ? "Allow microphone access when prompted. Microphone access requires HTTPS (except on localhost)."
          : "Voice calls need Google Chrome or Microsoft Edge on desktop. Microphone access requires HTTPS (except on localhost)."}
      </p>

      <ErrorBanner message={error} />
    </article>
  );
}

export default CallCard;
