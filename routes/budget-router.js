import express from "express";
import budgetController from "../controllers/budgetController.js";
import authUtils from "../utils/authUtils.js";
import { validateBudget } from "../middleware/validationMiddleware.js";

const budgetRoute = express.Router();

//authorise the user to use the api
budgetRoute.route("/").post(validateBudget, budgetController.createBudget);

export default budgetRoute;
