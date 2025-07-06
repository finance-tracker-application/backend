import express from "express";
import userAuthController from "../controllers/userAuthController.js";
import authUtils from "../utils/authUtils.js";
const authRouter = express.Router();

authRouter.route("/signup").post(userAuthController.signupController);
authRouter
  .route("/login")
  .post(userAuthController.loginController, authUtils.generateJWTToken);

authRouter.route("/forgotPassword").post(userAuthController.forgotPassword);

authRouter
  .route("/resetPassword/:passwordResetToken")
  .put(userAuthController.resetPassword);

export default authRouter;
