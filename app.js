import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import bodyParser from "body-parser";
import slowDown from "express-slow-down";

import dotenv from "dotenv";

import globalErrorHandler from "./utils/globalErrorhandler.js";
import AppError from "./utils/AppError.js";
import successResponse from "./utils/success-response.js";
import indexRouter from "./routes/index-route.js";
import { corsOptions, securityConfig } from "./config/security.js";

dotenv.config();

const app = express();

// Enhanced CORS configuration
app.use(cors(corsOptions));

// Enhanced security middleware
app.use(helmet(securityConfig.helmetConfig));

// Rate limiting
app.use(securityConfig.generalLimiter);

// Speed limiting
app.use(securityConfig.speedLimiter);

// Strict rate limiting for auth routes
app.use("/fin-tracker/v1/auth", securityConfig.authLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Security middleware
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

app.use("/", (request, response, next) => {
  const apiRequestTime = new Date();
  const dateTime = apiRequestTime.toISOString();
  console.log(`API called at ${dateTime}`);
  next();
});

app.get("/", (response, next) => {
  successResponse(200, "application is running", response);
});

app.use("/fin-tracker/v1", indexRouter);

app.use((req, res, next) => {
  next(
    new AppError(
      404,
      `The requested URL ${req.originalUrl} was not found on this server.`
    )
  );
});

app.use(globalErrorHandler); // this is called after the previous sttep or any error is called it be caught here

export default app;
