const dateTime = new Date().toISOString();

const globalErrorHandler = (error, response, next) => {
  error.statusCode = error.statusCode || 500;
  error.message = error.message || "System Failure";
  error.status = error.status || "Error";

  response.status(error.statusCode).json({
    dateTime: dateTime,
    message: error.message,
  });
};

export default globalErrorHandler;
