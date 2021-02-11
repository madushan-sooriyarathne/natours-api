import "reflect-metadata";
import { MetadataKeys } from "./enums/metadataKeys";
import { UserTypes } from "./enums/userTypes";

function authorizeUsers(...userTypes: UserTypes[]) {
  return function (target: any, key: string): void {
    Reflect.defineMetadata(MetadataKeys.authorize, userTypes, target, key);
  };
}

export { authorizeUsers };
