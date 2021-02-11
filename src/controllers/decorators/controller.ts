import "reflect-metadata";
import { NextFunction, RequestHandler, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { promisify } from "util";

import { AppRouter } from "../../Router";
import { MetadataKeys } from "./enums/metadataKeys";
import { Methods } from "./enums/routeNames";
import { UserTypes } from "./enums/userTypes";
import AppError from "../../utils/AppError";
import User from "../../models/User";

/**
 * Function that takes an array of validatorRules objects and
 * checks if request body has all necessary fields
 * @param {validatorRules[]} keys - An array of validatorRules that request body must match to
 */
function validateRequestBody(keys: validatorRules[]): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.body) {
      res.status(400).json({ status: "failed", message: "Invalid request" });
      return;
    }

    for (let key of keys) {
      if (!req.body[key.name]) {
        res.status(400).json({
          status: "failed",
          message: `${key.name} is missing in the request body`,
        });
        return;
      }

      if (typeof req.body[key.name] !== key.type) {
        res.status(400).json({
          status: "failed",
          message: `type of ${key.name} does not match to ${key.type}`,
        });
        return;
      }
    }
    next();
  };
}

/**
 * Function that takes list of allowed user types and
 * check if current user is authorized before reaching the specified route
 * @param userTypes - List of allowed user types
 * @returns {RequestHandler} - Middleware function that checks and authorize user types
 */
function authorizeUser(userTypes: UserTypes[]): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (userTypes.length < 1) {
      // No user types are mentioned
      // skip user authorization
      next();
      return;
    }

    const currentUser: UserDocument = (req as { [key: string]: any }).user;

    if (!currentUser)
      throw new AppError(
        "You must be authenticated first to use this route",
        403,
        "failed"
      );

    if (!userTypes.includes(currentUser.userType as UserTypes))
      throw new AppError(
        "You are not authorized to use this route",
        403,
        "failed"
      );

    next();
  };
}

/**
 * This function take a request handling handling function (async or non-async) as a argument and
 * handles any unhandled promise rejection errors
 * @param {AsyncRequestHandler | SyncRequestHandler | RequestHandler} fn - a route handling function which needed to be error handled
 * @returns {RequestHandler} - New RequestHandler function that wraps original request handler
 */
function handleAsyncErrors(fn: AsyncRequestHandler): RequestHandler {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    fn(req, res, next).catch((err) => next(err));
  };
}

/**
 * A class decorator function that used to for Route Controller classes
 * This decorator maps all the route handling functions and necessary middlewares
 * along with error handling phase of route handling functions
 * @function controller
 * @decorator
 * @param {string} routerPrefix - base route prefix for all route handlers
 */
export function controller(routerPrefix: string) {
  return function (target: Function) {
    const router = AppRouter.getRouter();

    for (const key in target.prototype) {
      // get the route handling method
      let routeHandler:
        | AsyncRequestHandler
        | SyncRequestHandler
        | RequestHandler = target.prototype[key];

      // Check if the method has async metadata
      const isAsync: boolean | undefined = Reflect.getMetadata(
        MetadataKeys.async,
        target.prototype,
        key
      );

      // Handle unhandled Rejection Errors if method is a async method
      if (isAsync) {
        routeHandler = handleAsyncErrors(routeHandler as AsyncRequestHandler);
      }

      // get the routes (if any specified)
      const route: string = Reflect.getMetadata(
        MetadataKeys.route,
        target.prototype,
        key
      );

      // get the method (if any specified)
      const method: Methods = Reflect.getMetadata(
        MetadataKeys.method,
        target.prototype,
        key
      );

      // Sync Middleware chain
      const syncMiddlewareList: SyncRequestHandler[] =
        Reflect.getMetadata(
          MetadataKeys.syncMiddleware,
          target.prototype,
          key
        ) || [];

      // Async Middleware chain
      const asyncMiddlewareList: AsyncRequestHandler[] | RequestHandler[] = (
        Reflect.getMetadata(
          MetadataKeys.asyncMiddleware,
          target.prototype,
          key
        ) || []
      ).map((middleware: AsyncRequestHandler | RequestHandler) =>
        handleAsyncErrors(middleware as AsyncRequestHandler)
      );

      // Body Validator Middleware
      const bodyValidatorRules: validatorRules[] =
        Reflect.getMetadata(
          MetadataKeys.bodyValidator,
          target.prototype,
          key
        ) || [];
      const bodyValidator: RequestHandler = validateRequestBody(
        bodyValidatorRules
      );

      // Authorize user middleware
      const authorizedUserTypes =
        Reflect.getMetadata(MetadataKeys.authorize, target.prototype, key) ||
        [];
      const authorizationMiddleware = authorizeUser(authorizedUserTypes);

      router
        .route(`${routerPrefix}${route}`)
        [method](
          ...syncMiddlewareList,
          ...asyncMiddlewareList,
          authorizationMiddleware,
          bodyValidator,
          routeHandler
        );
    }
  };
}
