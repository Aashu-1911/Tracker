const ErrorState = ({ message, onRetry, retryLabel = "Try again" }) => (
  <div className="notice error">
    <p>{message || "Something went wrong."}</p>
    {onRetry ? (
      <button className="ghost-button" type="button" onClick={onRetry}>
        {retryLabel}
      </button>
    ) : null}
  </div>
);

export default ErrorState;
