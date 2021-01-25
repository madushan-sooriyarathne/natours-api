import "reflect-metadata";
import { Methods } from "./enums/routeNames";
import { MetadataKeys } from "./enums/metadataKeys";

function routeBinder(method: string) {
  return function (route: string) {
    return function (target: any, key: string): void {
      Reflect.defineMetadata(MetadataKeys.route, route, target, key);
      Reflect.defineMetadata(MetadataKeys.method, method, target, key);
    };
  };
}

export const get = routeBinder(Methods.get);
export const post = routeBinder(Methods.post);
export const put = routeBinder(Methods.put);
export const del = routeBinder(Methods.del);
export const patch = routeBinder(Methods.patch);
