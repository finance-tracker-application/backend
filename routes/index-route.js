import express from "express";
import authRouter from "./auth-router.js";
import userRouter from "./user-router.js";
import transactionRouter from "./transaction-router.js";

const indexRouter = express.Router();

// Authentication routes (existing)
indexRouter.use("/auth", authRouter);

// User management routes
indexRouter.use("/users", userRouter);

indexRouter.use("/transactions", transactionRouter);

export default indexRouter;
