import express from "express";
import budgetController from "../controllers/budgetController.js";
import authUtils from "../utils/authUtils.js";
import { validateBudget } from "../middleware/validationMiddleware.js";

const budgetRoute = express.Router();

// Authorize the user to use the api
budgetRoute.use(authUtils.verifyJWTToken);

budgetRoute
  .route("/")
  .post(validateBudget, budgetController.createBudget)
  .get(budgetController.getBudgets);

budgetRoute
  .route("/:id")
  .get(budgetController.getBudgetById)
  .patch(budgetController.updateBudget)
  .delete(budgetController.deleteBudget);

export default budgetRoute;
