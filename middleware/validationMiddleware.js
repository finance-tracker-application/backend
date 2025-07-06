import AppError from "../utils/AppError.js";

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Username validation
const isValidUsername = (username) => {
  // 3-20 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Validate signup data
const validateSignup = (req, res, next) => {
  const { name, email, userName, password } = req.body;

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
        "Username must be 3-20 characters, alphanumeric and underscore only"
      )
    );
  }

  if (!isValidPassword(password)) {
    return next(
      new AppError(
        400,
        "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number"
      )
    );
  }

  next();
};

// Validate login data
const validateLogin = (req, res, next) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    return next(new AppError(400, "Username and password are required"));
  }

  next();
};

// Validate profile update
const validateProfileUpdate = (req, res, next) => {
  const { name, email, userName } = req.body;

  if (name && (name.length < 2 || name.length > 50)) {
    return next(new AppError(400, "Name must be between 2 and 50 characters"));
  }

  if (email && !isValidEmail(email)) {
    return next(new AppError(400, "Please provide a valid email address"));
  }

  if (userName && !isValidUsername(userName)) {
    return next(
      new AppError(
        400,
        "Username must be 3-20 characters, alphanumeric and underscore only"
      )
    );
  }

  next();
};

// Validate password change
const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(
      new AppError(400, "Current password and new password are required")
    );
  }

  if (!isValidPassword(newPassword)) {
    return next(
      new AppError(
        400,
        "New password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number"
      )
    );
  }

  next();
};

export {
  validateSignup,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
};
