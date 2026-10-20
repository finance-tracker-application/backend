import AppError from "../../utils/AppError.js";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from "../utils/validations.js";

const SIGNUP_WRITABLE_FIELDS = new Set([
  "name",
  "email",
  "userName",
  "password",
]);

// Validate signup data
const validateSignup = (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return next(new AppError(400, "Invalid request body"));
  }

  const unknownFields = Object.keys(body).filter((field) => {
    return !SIGNUP_WRITABLE_FIELDS.has(field);
  });

  if (unknownFields.length > 0) {
    return next(
      new AppError(400, `unknown fields: ${unknownFields.join(", ")}`),
    );
  }

  for (const field of SIGNUP_WRITABLE_FIELDS) {
    if (typeof body[field] !== "string") {
      return next(
        new AppError(400, `${field} is required and must be a string`),
      );
    }
  }

  const name = body.name.trim();
  const email = body.email.trim().toLowerCase();
  const userName = body.userName.trim();
  const password = body.password;

  if (!name || !email || !userName || !password) {
    return next(new AppError(400, "All fields are required"));
  }

  if (name.length < 2 || name.length > 50) {
    return next(new AppError(400, "Name must be between 2 and 50 characters"));
  }

  if (!isValidEmail(email)) {
    return next(new AppError(400, "Please provide a valid email address"));
  }

  if (!isValidUsername(userName)) {
    return next(
      new AppError(
        400,
        "Username must be 3-20 characters, alphanumeric and underscore only",
      ),
    );
  }

  if (!isValidPassword(password)) {
    return next(
      new AppError(
        400,
        "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number",
      ),
    );
  }

  res.locals.validatedInput = { name, email, userName, password };

  return next();
};

export { validateSignup };
