function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="error-message" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Retry summary
        </button>
      )}
    </div>
  );
}

export default ErrorBanner;
