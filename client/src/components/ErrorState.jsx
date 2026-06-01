const ErrorState = ({ message }) => (
  <div className="notice error">{message || "Something went wrong."}</div>
);

export default ErrorState;
