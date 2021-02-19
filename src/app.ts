import express, { Express } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";

import { AppRouter } from "./Router";
import globalErrorHandler from "./utils/ErrorHandlers";
import RateLimiter from "./utils/RateLimiter";
import AntiParameterPolluter from "./utils/AntiParameterPolluter";

import "./controllers/userController";
import "./controllers/tourController";
import "./controllers/authController";
import "./controllers/reviewController";
import "./controllers/tourReviewController";

// Always import the errorController after all other controllers
import "./controllers/errorController";
import { Server } from "http";

// uncaught Exception event subscriber
process.on("uncaughtException", function (err: Error): void {
  console.log(`${err.name} - ${err.message}`);
  process.exit(1);
});

// config dotenv
dotenv.config({ path: `${__dirname}/../config.env` });

// config the rate limiter
RateLimiter.config({
  maxRequestsAmount: 100,
  timeWindow: 60 * 60 * 1000,
  errorMessage: "Maximum amount of requests reached. Try again shortly",
});

const app: Express = express();

let db: string;

// connect to the local mongo server if on development env
// connect to the mongo atlas otherwise
if (process.env.NODE_ENV === "production") {
  db = (process.env.MONGO_ATLAS_CONNECTION_STRING as string).replace(
    "<PASS>",
    process.env.MONGO_ATLAS_DB_PASS as string
  );
} else {
  db = process.env.MONGO_LOCAL_CONNECTION_STRING as string;
}

// connect to the db via mongoose
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((): void => console.log("Successfully connected to the database"))
  .catch((err: Error) => {
    console.log(
      `Cannot establish the Database connection 🤯 \Error => ${err.message}`
    );
    process.exit(1);
  });

// set up security headers using helmet
app.use(helmet());

// limit request rates per hour
app.use(RateLimiter.limit());

// clean query parameters.
app.use(AntiParameterPolluter.preventPollution());

// parse request body and set maximum size of body
app.use(express.json({ limit: "10kb" }));

// get the custom router which has all route handlers attached to it.
app.use(AppRouter.getRouter());

/**
 * Error catching middleware
 * this globalErrorHandler function catch any errors that arise
 * in routeHandlers and send the failed/error response to
 * the client with given message & statusCode
 */
app.use(globalErrorHandler);

const server: Server = app.listen(3000, (): void =>
  console.log("Listing on port 3000")
);

// Unhandled promise rejection event subscriber
process.on("unhandledRejection", function (err: Error): void {
  console.log(`Unhandled Promise Rejection => ${err.message}`);
  server.close(function (): void {
    process.exit(1);
  });
});
