import express, { Express } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { AppRouter } from "./Router";
import globalErrorHandler from "./utils/ErrorHandlers";

import "./controllers/userController";
import "./controllers/tourController";
import "./controllers/authController";

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

console.log(db);

// connect to the db via mongoose
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((): void => console.log("Successfully connected to the database"))
  .catch((err: Error) => {
    console.log(
      `Cannot establish the Database connection 🤯 \Error => ${err.message}`
    );
    process.exit(1);
  });

app.use(express.json());
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
