import express from "express";
import authRouter from "./auth-router.js";

const indexRouter = express.Router();

indexRouter.use("/auth", authRouter);
indexRouter.use("/users", authRouter);

export default indexRouter;
