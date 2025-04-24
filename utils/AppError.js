class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.status = `${statusCode}`.startsWith("4") ? "Fail" : "System Failure";
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
