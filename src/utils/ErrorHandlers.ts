import { Request, Response, NextFunction } from "express";
import AppError from "./AppError";

/**
 * Error request handler for MongoError 11000 (Duplicate Key)
 * @param {Error} err - Error object
 * @param {Express.Response} res - Express's HTTP Response object
 */
async function handleDuplicateKeyError(
  err: Error,
  res: Response
): Promise<void> {
  const [key, value]: [string, unknown] = Object.entries(
    (err as { [key: string]: any }).keyValue
  )[0];

  res.status(409).json({
    status: "failed",
    message: `Duplicate Key - another object with value '${value}' as it's ${key} field already exists!`,
  });
}

/**
 * Error request handler for Mongodb ValidatorError
 * @param {Error} err - Error object
 * @param {Express.Response} res - Express's HTTP Response object
 */
async function handleValidatorError(err: Error, res: Response): Promise<void> {
  res.status(406).json({ status: "failed", message: err.message });
}

/**
 * Global Error handling function
 * @param {Error} err - Error object
 * @param {Express.Response} res - Express's HTTP Response object
 */
async function globalErrorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "failed";

  if (process.env.NODE_ENV === "development") {
    // Send the full error and original error message
    res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message, error: err });
  } else if (process.env.NODE_ENV === "production") {
    // Filter error message with if error is not a operational error
    if (err.isOpError) {
      // if isOpError is not null, means this is an AppError instance
      res
        .status(err.statusCode)
        .json({ status: err.status, message: err.message });
      return;
    }

    if ((err as { [key: string]: any }).code === 11000) {
      // MongoError (duplicate key error)
      handleDuplicateKeyError(err, res);
      return;
    }

    const [_, value]: [string, any] = Object.entries(
      (err as { [key: string]: any }).errors
    )[0];

    if (value.name === "ValidatorError") {
      // Mongodb ValidatorError
      handleValidatorError(err, res);
      return;
    }

    res.status(err.statusCode /** Default err code is 500 */).json({
      status: err.status /** Default error status is "error" */,
      message: "Something went wrong!",
    });
  }
}

export default globalErrorHandler;
