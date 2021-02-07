import "reflect-metadata";
import { MetadataKeys } from "./enums/metadataKeys";

function asyncHandler(target: any, key: string): void {
  Reflect.defineMetadata(MetadataKeys.async, true, target, key);
}

export { asyncHandler };
