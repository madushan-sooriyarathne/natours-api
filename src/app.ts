import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { AppRouter } from "./Router";
import globalErrorHandler from "./utils/ErrorHandlers";

import "./controllers/userController";
import "./controllers/tourController";
import "./controllers/errorController";

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
  .then((): void => console.log("Successfully connected to the database"));

app.use(express.json());
app.use(AppRouter.getRouter());

/**
 * Error catching middleware
 * this globalErrorHandler function catch any errors that arise
 * in routeHandlers and send the failed/error response to
 * the client with given message & statusCode
 */
app.use(globalErrorHandler);

app.listen(3000, (): void => console.log("Listing on port 3000"));
