const successResponse = (statusCode, object, response) => {
  const dateTime = new Date().toISOString();
  return response.status(statusCode).json({
    dateTime: dateTime,
    data: object,
  });
};

export default successResponse;
