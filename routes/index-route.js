import express from "express";
import authRouter from "./auth-router.js";
import userRouter from "./user-router.js";
import authRoutes from "./authRoutes.js";

const indexRouter = express.Router();

// Authentication routes (existing)
indexRouter.use("/auth", authRouter);

// New JWT refresh token routes
indexRouter.use("/auth", authRoutes);

// User management routes
indexRouter.use("/users", userRouter);

export default indexRouter;
