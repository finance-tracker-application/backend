import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import catchAsyncFunction from "../utils/catchAsyncFunction.js";
import sendEmail from "../config/notification-config.js";
import {
  ACCOUNT_CREATION_EMAIL,
  ACCOUNT_RESET,
} from "../utils/emailTemplates.js";
import successResponse from "../utils/success-response.js";

const signupController = catchAsyncFunction(async (request, response, next) => {
  const { body } = request;
  const findUser = await User.findOne({ userName: body.userName });

  if (findUser) {
    return next(new AppError(409, "User Exists"));
  }

  const saveUser = new User(body);
  const savedUser = await saveUser.save();
  if (!savedUser) {
    return next(new AppError(409, "User could not be created"));
  }

  await sendEmail(
    savedUser.email,
    `User Account Created`,
    ACCOUNT_CREATION_EMAIL(savedUser.name)
  );

  const updatedPayload = savedUser.toObject();
  delete updatedPayload.password;

  return successResponse(200, updatedPayload, response);
});

const loginController = catchAsyncFunction(async (request, response, next) => {
  const { userName, password } = request.body;
  const findUser = await User.findOne({ userName: userName }).exec();

  if (!findUser) {
    return next(new AppError(404, "User does not exist"));
  }

  const isMatch = await findUser.matchPassword(password);

  if (!isMatch) {
    return next(new AppError(401, "Username and Password invalid"));
  }
  findUser.password = undefined;
  request.body = findUser;

  next();
});

const forgotPassword = catchAsyncFunction(async (request, response, next) => {
  const { userName } = request.body;
  const findUser = await User.findOne({ userName: userName });

  if (!findUser) {
    return next(new AppError("404", "User not found Password Cannot be reset"));
  }

  const resetToken = findUser.createPasswordResetToken();
  await findUser.save();

  const resetUrl = `${process.env.applicationUrl}/resetPassword/${resetToken}`;

  await sendEmail(
    findUser.email,
    "Fin-tracker Password reset",
    ACCOUNT_RESET(findUser.userName, resetUrl)
  );

  successResponse(200, { message: "Password reset link created" }, response);
});

const resetPassword = catchAsyncFunction(async (request, response, next) => {
  const { passwordResetToken, password } = request.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const findUser = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now },
  });

  if (!findUser) {
    return next(new AppError("404", "User not found Password Cannot be reset"));
  }

  findUser.password = password;
  findUser.passwordChangedAt = Date.now();
  findUser.passwordResetToken = undefined;
  findUser.passwordResetExpires = undefined;
  await findUser.save();

  await sendEmail(
    findUser.email,
    "Fin-tracker the Password has been reset",
    ACCOUNT_RESET(findUser.userName, resetUrl)
  );

  successResponse(200, { message: "Password reset link created" }, response);
});

export default {
  signupController,
  loginController,
  forgotPassword,
  resetPassword,
};
