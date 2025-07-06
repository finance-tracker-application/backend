import express from "express";
import userAuthController from "../controllers/userAuthController.js";
import authUtils from "../utils/authUtils.js";

const profileRouter = express.Router();

profileRouter.route("/me").get(authUtils.verifyJWTToken);

export default profileRouter;
