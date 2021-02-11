import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";
import { all, asyncHandler, controller } from "./decorators";

/**
 * 404 error handling route
 * Always import this route controller after importing all other controllers
 * @class
 * @author Madushan Sooriyarathne <madushan.sooriyarathne@outlook.com>
 */
@controller("/")
class ErrorController {
  /**
   * Handle all requests that wasn't handled by previous route handlers
   * @function handle404
   * @param {Express.Request} req - Express request object
   * @param {Express.Response} res - Express Response object
   * @param {Express.NextFunction} next - function that points to next middleware
   */
  @all("*")
  @asyncHandler
  async handle404(req: Request, res: Response): Promise<void> {
    throw new AppError(
      `path ${req.url} does not accept ${req.method} requests`,
      404
    );
  }
}
