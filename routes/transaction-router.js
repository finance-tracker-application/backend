import express from "express";
import transactionController from "../controllers/transactionController.js";
import authUtils from "../utils/authUtils.js";

const transactionRouter = express.Router();

transactionRouter
  .route("/")
  .post(authUtils.verifyJWTToken, transactionController.createTransaction);

export default transactionRouter;
