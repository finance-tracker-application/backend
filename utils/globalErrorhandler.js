const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "System Failure";
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    dateTime: new Date().toISOString(), // Create fresh time for each error
    status: err.status, // Send status ("fail" or "error")
    message: err.message,
  });
};

export default globalErrorHandler;
