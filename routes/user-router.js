import express from "express";
import userController from "../controllers/userController.js";
import authUtils from "../utils/authUtils.js";
import {
  validateProfileUpdate,
  validatePasswordChange,
} from "../middleware/validationMiddleware.js";

const userRouter = express.Router();

// All user routes require authentication
userRouter.use(authUtils.verifyJWTToken);

// User profile routes
userRouter
  .route("/profile")
  .get(userController.getProfile)
  .put(validateProfileUpdate, userController.updateProfile)
  .delete(userController.deleteProfile);

// User settings routes
userRouter
  .route("/settings")
  .get(userController.getSettings)
  .put(userController.updateSettings);

// Change password route
userRouter
  .route("/change-password")
  .put(validatePasswordChange, userController.changePassword);

export default userRouter;
