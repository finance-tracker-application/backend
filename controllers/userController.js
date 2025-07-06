import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import catchAsyncFunction from "../utils/catchAsyncFunction.js";
import successResponse from "../utils/success-response.js";
import bcrypt from "bcryptjs";

// Get user profile
const getProfile = catchAsyncFunction(async (request, response, next) => {
  const userId = request.token.id;
  const user = await User.findById(userId).select("-password -refreshToken");

  if (!user) {
    return next(new AppError(404, "User not found"));
  }

  return successResponse(200, user, response);
});

// Update user profile
const updateProfile = catchAsyncFunction(async (request, response, next) => {
  const userId = request.token.id;
  const { name, email, userName } = request.body;

  // Check if email or username already exists
  if (email) {
    const existingUser = await User.findOne({
      email,
      _id: { $ne: userId },
    });
    if (existingUser) {
      return next(new AppError(409, "Email already exists"));
    }
  }

  if (userName) {
    const existingUser = await User.findOne({
      userName,
      _id: { $ne: userId },
    });
    if (existingUser) {
      return next(new AppError(409, "Username already exists"));
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { name, email, userName },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    return next(new AppError(404, "User not found"));
  }

  return successResponse(200, updatedUser, response);
});

// Delete user profile
const deleteProfile = catchAsyncFunction(async (request, response, next) => {
  const userId = request.token.id;

  const deletedUser = await User.findByIdAndDelete(userId);

  if (!deletedUser) {
    return next(new AppError(404, "User not found"));
  }

  return successResponse(
    200,
    { message: "Profile deleted successfully" },
    response
  );
});

// Get user settings
const getSettings = catchAsyncFunction(async (request, response, next) => {
  const userId = request.token.id;
  const user = await User.findById(userId).select("role createdAt");

  if (!user) {
    return next(new AppError(404, "User not found"));
  }

  return successResponse(
    200,
    {
      role: user.role,
      memberSince: user.createdAt,
      accountStatus: "active",
    },
    response
  );
});

// Update user settings
const updateSettings = catchAsyncFunction(async (request, response, next) => {
  const userId = request.token.id;
  const { role } = request.body;

  // Only allow role updates if user is admin
  if (role && request.token.role !== "admin") {
    return next(new AppError(403, "Only admins can change roles"));
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    return next(new AppError(404, "User not found"));
  }

  return successResponse(200, updatedUser, response);
});

// Change password
const changePassword = catchAsyncFunction(async (request, response, next) => {
  const userId = request.token.id;
  const { currentPassword, newPassword } = request.body;

  if (!currentPassword || !newPassword) {
    return next(
      new AppError(400, "Current password and new password are required")
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError(404, "User not found"));
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new AppError(401, "Current password is incorrect"));
  }

  // Update password
  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  return successResponse(
    200,
    { message: "Password changed successfully" },
    response
  );
});

export default {
  getProfile,
  updateProfile,
  deleteProfile,
  getSettings,
  updateSettings,
  changePassword,
};
