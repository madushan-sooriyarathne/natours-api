import { Request, Response, NextFunction, RequestHandler } from "express";
import { ParsedQs } from "qs";

/**
 * Parameter Result types / scenarios
 *
 * parameter: ?name=jane&sort=price
 * express result: {name: "jane", sort: "price"}
 *
 * parameter: ?name=jane&name=sam&sort=price
 * express result: {name: ["jane", "sam"], sort: "price"}
 *
 * parameter: ?name[gt]=jane&name=sam&sort=price
 * express result: {name: {gt: "jane", sam: true}, sort: "price"}
 *
 * parameter: ?name[gt]=jane&name=sam&name=tom&sort=price
 * express result: {name: {0: "sam", 1: "tom", gt: "jane"}, sort: "price"}
 *
 * parameter: ?name[gt]=jane&name=sam&name=tom&name[lt]=jack&sort=price
 * express result: {name: {0: "sam", 1: "tom", gt: "jane", lt: "jack"}, sort: "price"}
 *
 * parameter: ?name[gt]=jane&name=sam&name[lt]=jack&sort=price
 * express result: {name: {gt: "jane", lt: "jack", "sam": true}, sort: "price"}
 *
 * parameter: ?name[gt]=jane&name[lt]=jack&sort=price
 * express result: {name: {gt: "jane", lt: "jack"}, sort: "price"}
 *
 */

class AntiParameterPolluter {
  // TODO: implement the whitelist feature
  // static whiteListOptions: string[] = [];

  static preventPollution(): RequestHandler {
    return function (req: Request, res: Response, next: NextFunction): void {
      let cleanedQuery: ParsedQs = {};

      for (let [key, value] of Object.entries(req.query)) {
        // if value is an array, add the last value
        if (Array.isArray(value)) {
          cleanedQuery[key] = value[value.length - 1];
          continue;
        }

        // If the value is a object
        if (value instanceof Object) {
          // if the value is a object means, there's a comparison operator involved
          // thus loop through the object and add the first occurrence of the comparison operator
          // O(n^2) at this point
          for (let [id, item] of Object.entries(value)) {
            if (["gt", "gte", "lt", "lte", "ne"].includes(id)) {
              cleanedQuery[key] = { [id]: item };
              break;
            }
          }

          continue;
        }

        // keep the value as it was
        cleanedQuery[key] = value;
      }

      // assign new cleaned Query to req.query
      req.query = cleanedQuery;

      next();
    };
  }
}

export default AntiParameterPolluter;
