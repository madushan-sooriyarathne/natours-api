import { RequestHandler } from "express";
import "reflect-metadata";
import { MetadataKeys } from "./enums/metadataKeys";

function use(middleware: RequestHandler) {
  return function (target: any, key: string) {
    const middlewareList: RequestHandler[] =
      Reflect.getMetadata(MetadataKeys.syncMiddleware, target, key) || [];

    Reflect.defineMetadata(
      MetadataKeys.syncMiddleware,
      [...middlewareList, middleware],
      target,
      key
    );
  };
}

function useAsync(middleware: RequestHandler) {
  return function (target: any, key: string) {
    const middlewareList: RequestHandler[] =
      Reflect.getMetadata(MetadataKeys.asyncMiddleware, target, key) || [];

    Reflect.defineMetadata(
      MetadataKeys.asyncMiddleware,
      [...middlewareList, middleware],
      target,
      key
    );
  };
}

export { use, useAsync };
