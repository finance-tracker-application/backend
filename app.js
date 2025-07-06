import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import bodyParser from "body-parser";

import dotenv from "dotenv";

import globalErrorHandler from "./utils/globalErrorhandler.js";
import AppError from "./utils/AppError.js";
import successResponse from "./utils/success-response.js";
import indexRouter from "./routes/index-route.js";

dotenv.config();
//creating the cors configuration for cors
const allowedOriginString = process.env.allowedorigin;

const allowedOrigins = allowedOriginString
  ? allowedOriginString.split(",")
  : [];
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

const app = express(); //creating the express of the backend application

app.use(cors(corsOptions)); // to enables cors

//rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(rateLimiter);

app.use(express.json()); //to have the data to be accepted as json right

app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());
// Use bodyParser middleware for parsing URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

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
