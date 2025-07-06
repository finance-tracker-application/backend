import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateTokens = (userId) => {
  // Generate JWT token
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // Access token expires in 15 minutes
  );

  // Generate refresh token
  const refreshToken = crypto.randomBytes(40).toString("hex");
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiry,
  };
};

export default generateTokens;
