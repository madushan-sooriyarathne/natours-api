import "reflect-metadata";
import { NextFunction, RequestHandler, Request, Response } from "express";

import { AppRouter } from "../../Router";
import { MetadataKeys } from "./enums/metadataKeys";
import { Methods } from "./enums/routeNames";
import { UserTypes } from "./enums/userTypes";
import AppError from "../../utils/AppError";
import { TypeStrings } from "./enums/typeStrings";

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
      // Check if the body property exists
      if (!req.body[key.name]) {
        res.status(400).json({
          status: "failed",
          message: `${key.name} is missing in the request body`,
        });
        return;
      }

      // Check the type
      if (typeof req.body[key.name] !== key.type) {
        res.status(400).json({
          status: "failed",
          message: `type of ${key.name} does not match to ${key.type}`,
        });
        return;
      }

      // String validations
      if (key.type === TypeStrings.String) {
        if (key.validators && key.validators.length > 0) {
          for (let validatorFn of key.validators) {
            const [validated, errorMessage] = validatorFn(req.body[key.name]);

            if (!validated) {
              res.status(406).json({ status: "failed", message: errorMessage });
              return;
            }
          }
        }
      }
    }

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

      router
        .route(`${routerPrefix}${route}`)
        [method](
          ...syncMiddlewareList,
          ...asyncMiddlewareList,
          bodyValidator,
          routeHandler
        );
    }
  };
}
