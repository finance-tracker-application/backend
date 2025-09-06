import express from "express";
import authRouter from "./auth-router.js";
import userRouter from "./user-router.js";
import authRoutes from "./authRoutes.js";

const indexRouter = express.Router();

// Authentication routes (existing)
indexRouter.use("/auth", authRouter);

// User management routes
indexRouter.use("/users", userRouter);

export default indexRouter;
