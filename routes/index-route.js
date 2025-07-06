import express from "express";
import authRouter from "./auth-router.js";
import userRouter from "./user-router.js";
import authRoutes from "./authRoutes.js";
import transactionRouter from "./transactionRoutes.js";
import budgetRouter from "./budgetRoutes.js";

const indexRouter = express.Router();

// Authentication routes (existing)
indexRouter.use("/auth", authRouter);

// New JWT refresh token routes
indexRouter.use("/auth", authRoutes);

// User management routes
indexRouter.use("/users", userRouter);

// Financial tracking routes
indexRouter.use("/transactions", transactionRouter);
indexRouter.use("/budgets", budgetRouter);

export default indexRouter;
