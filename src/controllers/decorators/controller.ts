import "reflect-metadata";
import { NextFunction, RequestHandler, Request, Response } from "express";
import { AppRouter } from "../../Router";
import { MetadataKeys } from "./enums/metadataKeys";
import { Methods } from "./enums/routeNames";

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

export function controller(routerPrefix: string) {
  return function (target: Function) {
    const router = AppRouter.getRouter();

    for (const key in target.prototype) {
      // get the route handling method
      const routeHandler: RequestHandler = target.prototype[key];

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
        routeHandler
      );
    }
  };
}
