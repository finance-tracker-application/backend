import User from "../models/User.js";
import generateTokens from "../utils/generateToken.js";
import asyncHandler from "express-async-handler";

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // Generate tokens
    const { accessToken, refreshToken, refreshTokenExpiry } = generateTokens(
      user._id
    );

    // Store refresh token in database
    user.refreshToken = {
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
      createdAt: new Date(),
    };
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Get new access token using refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401);
    throw new Error("Refresh token is required");
  }

  // Find user with the refresh token
  const user = await User.findOne({
    "refreshToken.token": refreshToken,
    "refreshToken.expiresAt": { $gt: new Date() },
  });

  if (!user) {
    res.status(401);
    throw new Error("Invalid or expired refresh token");
  }

  // Generate new tokens
  const {
    accessToken,
    refreshToken: newRefreshToken,
    refreshTokenExpiry,
  } = generateTokens(user._id);

  // Update refresh token in database
  user.refreshToken = {
    token: newRefreshToken,
    expiresAt: refreshTokenExpiry,
    createdAt: new Date(),
  };
  await user.save();

  res.json({
    accessToken,
    refreshToken: newRefreshToken,
  });
});

// @desc    Logout user / clear refresh token
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Clear refresh token
    user.refreshToken = undefined;
    await user.save();
  }

  res.json({ message: "Logged out successfully" });
});

export { loginUser, refreshToken, logoutUser };
