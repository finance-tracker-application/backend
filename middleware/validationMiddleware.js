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

// Transaction validation
const validateTransaction = (req, res, next) => {
  const { type, categoryId, amount, note, currency } = req.body;

  if (!type || !["income", "expense", "transfer"].includes(type)) {
    return next(new AppError(400, "Valid transaction type is required"));
  }

  if (!categoryId) {
    return next(new AppError(400, "Category is required"));
  }

  if (!amount || amount <= 0) {
    return next(new AppError(400, "Valid amount is required"));
  }
  if (!note || note.trim().length === 0) {
    return next(new AppError(400, "Description is required"));
  }

  if (note.length > 500) {
    return next(
      new AppError(400, "Description must be less than 500 characters")
    );
  }

  if (
    currency &&
    !["USD", "EUR", "GBP", "INR", "CAD", "AUD"].includes(currency)
  ) {
    return next(new AppError(400, "Invalid currency"));
  }

  // Validate tags
  if (req.body.tags && Array.isArray(req.body.tags)) {
    req.body.tags.forEach((tag) => {
      if (tag.length > 20) {
        return next(new AppError(400, "Tags must be less than 20 characters"));
      }
    });
  }

  next();
};

// Budget validation
const validateBudget = (req, res, next) => {
  const { name, type, period, categories, currency } = req.body;

  if (!name || name.trim().length === 0) {
    return next(new AppError(400, "Budget name is required"));
  }

  if (name.length > 100) {
    return next(
      new AppError(400, "Budget name must be less than 100 characters")
    );
  }

  if (type && !["monthly", "yearly", "custom"].includes(type)) {
    return next(new AppError(400, "Invalid budget type"));
  }

  if (!period || !period.startDate || !period.endDate) {
    return next(
      new AppError(400, "Budget period with start and end dates is required")
    );
  }

  if (new Date(period.endDate) <= new Date(period.startDate)) {
    return next(new AppError(400, "End date must be after start date"));
  }

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return next(new AppError(400, "At least one category is required"));
  }

  categories.forEach((cat) => {
    if (!cat.categoryId || cat.allocatedAmount == null) {
      return next(
        new AppError(
          400,
          "Each category must include categoryId and allocated amount"
        )
      );
    }

    if (cat.allocatedAmount <= 0) {
      return next(new AppError(400, "Allocated amount must be greater than 0"));
    }
  });

  if (
    currency &&
    !["USD", "EUR", "GBP", "INR", "CAD", "AUD"].includes(currency)
  ) {
    return next(new AppError(400, "Invalid currency"));
  }

  next();
};

export {
  validateSignup,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateTransaction,
  validateBudget,
};
