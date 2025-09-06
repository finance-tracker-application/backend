import express from "express";
import transactionController from "../controllers/transactionController.js";
import authUtils from "../utils/authUtils.js";
import { validateTransaction } from "../middleware/validationMiddleware.js";

const transactionRouter = express.Router();

// All routes require authentication
transactionRouter.use(authUtils.verifyJWTToken);

// Transaction CRUD routes
transactionRouter
  .route("/")
  .post(validateTransaction, transactionController.createTransaction)
  .get(transactionController.getTransactions);

transactionRouter
  .route("/analytics")
  .get(transactionController.getTransactionAnalytics);

transactionRouter
  .route("/bulk-import")
  .post(transactionController.bulkImportTransactions);

transactionRouter
  .route("/export")
  .get(transactionController.exportTransactions);

transactionRouter
  .route("/:id")
  .get(transactionController.getTransactionById)
  .put(validateTransaction, transactionController.updateTransaction)
  .delete(transactionController.deleteTransaction);

export default transactionRouter;
