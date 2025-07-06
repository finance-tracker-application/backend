import express from "express";
import budgetController from "../controllers/budgetController.js";
import authUtils from "../utils/authUtils.js";
import { validateBudget } from "../middleware/validationMiddleware.js";

const budgetRouter = express.Router();

// All routes require authentication
budgetRouter.use(authUtils.verifyJWTToken);

// Budget CRUD routes
budgetRouter
  .route("/")
  .post(validateBudget, budgetController.createBudget)
  .get(budgetController.getBudgets);

budgetRouter.route("/overview").get(budgetController.getBudgetOverview);

budgetRouter.route("/template").post(budgetController.createBudgetFromTemplate);

budgetRouter
  .route("/:id")
  .get(budgetController.getBudgetById)
  .put(validateBudget, budgetController.updateBudget)
  .delete(budgetController.deleteBudget);

budgetRouter.route("/:id/analytics").get(budgetController.getBudgetAnalytics);

budgetRouter.route("/:id/duplicate").post(budgetController.duplicateBudget);

export default budgetRouter;
