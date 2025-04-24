const dateTime = new Date().toISOString();

const successResponse = (statusCode, object, response) => {
  return response.status(statusCode).json({
    dateTime: dateTime,
    data: object,
  });
};

export default successResponse;
