import { Request, Response, NextFunction } from "express";
import AppError from "./AppError";

/**
 * Error request handler for Mongodb DuplicateKeyError
 * @param {Error} err - Error object
 * @returns {AppError} - AppError instance with message and proper http error details
 */
function handleDuplicateKeyError(err: Error): AppError {
  const [key, value]: [string, unknown] = Object.entries(
    (err as { [key: string]: any }).keyValue
  )[0];

  return new AppError(
    `Duplicate Key - another object with value '${value}' as it's ${key} field already exists!`,
    409,
    "failed"
  );
}

/**
 * Error request handler for Mongodb ValidatorError
 * @param {Error} err - Error object
 * @returns {AppError} - AppError instance with message and proper http error details
 */
function handleValidatorError(err: Error): AppError {
  return new AppError(err.message, 406, "failed");
}

/**
 * Error request handler for JWT expired error
 * @param {Error} err - Error object
 * @returns {AppError} - AppError instance with message and proper http error details
 */
function handleJWTExpiredError(err: Error): AppError {
  return new AppError(
    "Auth Token is expired! Please log-in again",
    401,
    "failed"
  );
}

/**
 * Error request handler for Mongodb ValidatorError
 * @param {Error} err - Error object
 * @returns {AppError} - AppError instance with message and proper http error details
 */
function handleJWTTamperedError(err: Error): AppError {
  return new AppError(
    "Auth Token cannot be validated. Please log-in again",
    401,
    "failed"
  );
}

/**
 * Global Error handling function
 * @param {Error} err - Error object
 * @param {Express.Response} res - Express's HTTP Response object
 */
function globalErrorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "failed";

  if (process.env.NODE_ENV === "development") {
    // Send the full error and original error message
    res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message, error: err });
  } else if (process.env.NODE_ENV === "production") {
    // Special Error types and handlers
    // MongoError (duplicate key error)
    if ((err as { [key: string]: any }).code === 11000)
      err = handleDuplicateKeyError(err);

    // MongoDB ValidatorError (mongoose validation is failed)
    if ((err as { [key: string]: any }).errors) {
      const val: any[] = Object.values((err as { [key: string]: any }).errors);

      if (val.length > 0 && val[0].name === "ValidatorError") {
        err = handleValidatorError(err);
      }
    }

    // JWT expired
    if ((err as { [key: string]: any }).name == "TokenExpiredError") {
      err = handleJWTExpiredError(err);
    }

    // JWT cannot verified
    if ((err as { [key: string]: any }).name == "JsonWebTokenError") {
      err = handleJWTTamperedError(err);
    }

    // Filter error message with error type (AppError or not - using the opError field in possible AppError objects)
    if (err.isOpError) {
      // if isOpError is true, means this is an AppError instance
      res
        .status(err.statusCode)
        .json({ status: err.status, message: err.message });
      return;
    }

    // Error is not a AppError Instance
    // Send the Error status to the client
    res.status(err.statusCode /** Default error code is 500 */).json({
      status: err.status /** Default error status is "error" */,
      message: "Something went wrong!",
    });
  }
}

export default globalErrorHandler;
