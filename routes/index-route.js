import express from "express";
import authRouter from "./auth-router.js";
import userRouter from "./user-router.js";
import transactionRouter from "./transaction-router.js";
import categoryRouter from "./category-router.js";
import budgetRouter from "./budget-router.js";

const indexRouter = express.Router();

// Authentication routes (existing)
indexRouter.use("/auth", authRouter);

// User management routes
indexRouter.use("/users", userRouter);

indexRouter.use("/transactions", transactionRouter);

//category management routes

indexRouter.use("/categories", categoryRouter);

// budget management routes
indexRouter.use("/budgets", budgetRouter);

export default indexRouter;
