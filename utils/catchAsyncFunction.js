const catchAsyncFunction = (fn) => {
  return (request, response, next) => {
    fn(request, response, next).catch(next);
  };
};

export default catchAsyncFunction;
