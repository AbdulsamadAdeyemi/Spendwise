export function errorHandler(err, req, res, next) {
  // Keep the four-argument Express error-handler signature.
  void next;
  console.error("Unhandled Server Error:", err);
  const status = err.status || 500;
  const message = err.message || "An unexpected internal server error occurred.";
  res.status(status).json({ error: message });
}
