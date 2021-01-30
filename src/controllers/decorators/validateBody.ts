import "reflect-metadata";
import { MetadataKeys } from "./enums/metadataKeys";

function validateBody(...keys: validatorRules[]) {
  return function (
    target: any,
    key: string,
    descriptor: PropertyDescriptor
  ): void {
    Reflect.defineMetadata(MetadataKeys.bodyValidator, keys, target, key);
  };
}

export { validateBody };
