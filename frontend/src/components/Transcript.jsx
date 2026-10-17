function Transcript({ messages }) {
  return (
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

      <div className="transcript-content" aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty-transcript">
            <div className="transcript-symbol">Aa</div>
            <strong>Your conversation starts here</strong>

            <p>Your questions and Aria's replies will appear here during the call.</p>
          </div>
        ) : (
          messages.map((message) =>
            message.role === "tool" ? (
              <span className="tool-chip" key={message.id}>
                {message.text}
              </span>
            ) : (
              <div className="message" key={message.id}>
                <strong>{message.role}</strong>
                <p>{message.text}</p>
              </div>
            )
          )
        )}
      </div>
    </article>
  );
}

export default Transcript;
