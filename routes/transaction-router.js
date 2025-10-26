import express from "express";
import transactionController from "../controllers/transactionController.js";
import { validateTransaction } from "../middleware/validationMiddleware.js";
import authUtils from "../utils/authUtils.js";

const transactionRouter = express.Router();

transactionRouter.use(authUtils.verifyJWTToken);

transactionRouter
  .route("/")
  .post(validateTransaction, transactionController.createTransaction)
  .get(transactionController.getAllTransactions);

transactionRouter
  .route("/:id")
  .get(transactionController.getTransactionById)
  .put(validateTransaction, transactionController.updateTransaction)
  .delete(validateTransaction, transactionController.deleteTransaction);

export default transactionRouter;
