import express from "express";
import userAuthController from "../controllers/userAuthController.js";
import authUtils from "../utils/authUtils.js";

import {
  validateSignup,
  validateLogin,
} from "../middleware/validationMiddleware.js";

const authRouter = express.Router();

authRouter
  .route("/signup")
  .post(validateSignup, userAuthController.signupController);
authRouter
  .route("/login")
  .post(
    validateLogin,
    userAuthController.loginController,
    authUtils.generateJWTToken
  );

authRouter.route("/forgotPassword").post(userAuthController.forgotPassword);

authRouter
  .route("/resetPassword/:passwordResetToken")
  .put(userAuthController.resetPassword);

authRouter
  .route("/logout")
  .post(authUtils.verifyJWTToken, userAuthController.logoutController);

export default authRouter;
