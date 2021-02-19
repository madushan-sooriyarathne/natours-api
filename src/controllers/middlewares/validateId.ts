import { Request, Response, NextFunction, RequestHandler } from "express";
import { Model, Document } from "mongoose";
import AppError from "../../utils/AppError";

/**
 * A middleware factory function that returns a middleware which checks if a
 * url param named "id" exists
 * @function validateId
 * @async
 * @param {Model<Document>} model - Mongoose db model
 * @returns {RequestHandler} - The actual middleware function
 */

function validateId<T extends Document>(model: Model<T>): RequestHandler {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!req.params.id)
      throw new AppError("Invalid request. you must have a id parameter", 404);

    const fetchedDocument: T | null = await model.findById(req.params.id);

    if (!fetchedDocument)
      throw new AppError(
        `Invalid tour id. ${req.params.id} does not associate with any existing tours`,
        404
      );

    next();
  };
}

export { validateId };
