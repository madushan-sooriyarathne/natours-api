import "reflect-metadata";
import { NextFunction, RequestHandler, Request, Response } from "express";
import { AppRouter } from "../../Router";
import { MetadataKeys } from "./enums/metadataKeys";
import { Methods } from "./enums/routeNames";

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
 * This function take a route handling function as a argument and
 * attach a catch statement. Then return it after wrapping it in a another RequestHandler
 * @param {(req: Request, res: Response, next?:NextFunction) => Promise<void>} fn - a route handling function which needed to be error handled
 * @returns {RequestHandler} - New RequestHandler function that wraps original request handler
 */
function handleErrors(
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<void>
): RequestHandler {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    fn(req, res, next).catch((error) => next(error));
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
      let routeHandler: (
        req: Request,
        res: Response,
        next?: NextFunction
      ) => Promise<void> = target.prototype[key];

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

      // get middleware list
      const middlewareList: RequestHandler[] =
        Reflect.getMetadata(MetadataKeys.middleware, target.prototype, key) ||
        [];

      const bodyValidatorRules: validatorRules[] =
        Reflect.getMetadata(
          MetadataKeys.bodyValidator,
          target.prototype,
          key
        ) || [];
      const bodyValidator: RequestHandler = validateRequestBody(
        bodyValidatorRules
      );

      router[method](
        `${routerPrefix}${route}`,
        ...middlewareList,
        bodyValidator,
        handleErrors(routeHandler)
      );
    }
  };
}
