import jwt from "jsonwebtoken";
import catchAsyncFunction from "./catchAsyncFunction.js";
import successResponse from "./success-response.js";
import AppError from "./AppError.js";

const generateJWTToken = catchAsyncFunction(async (request, response, next) => {
  const { body } = request;
  const bodyPayload = body;
  const secret = process.env.secret;

  const options = {
    expiresIn: process.env.expirationOption,
  };

  // Create JWT payload with user ID
  const jwtPayload = {
    id: bodyPayload._id,
    name: bodyPayload.name,
    email: bodyPayload.email,
    role: bodyPayload.role,
  };

  const token = jwt.sign(jwtPayload, secret, options);

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
