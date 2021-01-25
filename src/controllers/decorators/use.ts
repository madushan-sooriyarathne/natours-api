import { RequestHandler } from "express";
import "reflect-metadata";
import { MetadataKeys } from "./enums/metadataKeys";

function use(middleware: RequestHandler) {
  return function (target: any, key: string) {
    const middlewareList: RequestHandler[] =
      Reflect.getMetadata(MetadataKeys.middleware, target, key) || [];

    Reflect.defineMetadata(
      MetadataKeys.middleware,
      [...middlewareList, middleware],
      target,
      key
    );
  };
}

export { use };
