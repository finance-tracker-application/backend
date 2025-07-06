import jwt from "jsonwebtoken";
import catchAsyncFunction from "./catchAsyncFunction.js";
import successResponse from "./success-response.js";

const generateJWTToken = catchAsyncFunction(async (request, response, next) => {
  const { body } = request;
  const bodyPayload = body.toObject();
  const secret = process.env.secret;

  const options = {
    expiresIn: process.env.expirationOption,
  };

  const token = jwt.sign(bodyPayload, secret, options);

  const userPayload = bodyPayload;
  userPayload.token = token;

  return successResponse(200, userPayload, response);
});

const verifyJWTToken = catchAsyncFunction(async (request, response, next) => {
  const bearerToken = request.headers.authorization?.split(" ")[1];

  if (!bearerToken) {
    return next(new AppError(401, "Access Denied: Invalid Token"));
  }

  jwt.verify(bearerToken, process.env.secret, (err, decoded) => {
    if (err) {
      return next(new AppError(401, "Access Denied: Invalid Token")); //res.status(401).send("Invalid Token");
    }

    request.token = decoded; // Store user information from JWT in the request object
    next(); // Continue to the next middleware or route handler
  });
});

export default {
  generateJWTToken,
  verifyJWTToken,
};
