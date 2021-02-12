import { Request, Response, NextFunction, RequestHandler } from "express";
import AppError from "./AppError";

interface ConfigOptions {
  maxRequestsAmount: number;
  timeWindow: number;
  errorMessage: string;
  statusCode?: number;
}

/**
 * Simple in-memory request rate limiter for express
 * Stores data as key value pairs in a JS Map object
 * @class
 */
class RateLimiter {
  static maxRequestsAmount: number;
  static timeWindow: number;
  static errorMessage: string;
  static statusCode: number;
  static inMemStore: Map<string, number> = new Map<string, number>();

  /**
   * Configure the RateLimiter with given configuration Object.
   * Also, start the setInterval to reset the in-memory Map
   * @method config
   * @static
   * @param {ConfigOptions} options - RateLimiter configuration options
   *
   */
  static config(options: ConfigOptions): void {
    RateLimiter.maxRequestsAmount = options.maxRequestsAmount;
    RateLimiter.timeWindow = options.timeWindow;
    RateLimiter.errorMessage =
      options.errorMessage ||
      "Maximum amount of requests reached. Try again shortly";
    RateLimiter.statusCode = options.statusCode || 429;

    // set Interval
    setInterval(
      (): void => RateLimiter.inMemStore.clear(),
      RateLimiter.timeWindow
    );
  }

  /**
   * Returns a RequestHandler function that can be used as a express middleware to limit the incoming requests
   * @returns {RequestHandler} - Request Handler function that used to limit the incoming requests
   */
  static limit(): RequestHandler {
    return function (req: Request, res: Response, next: NextFunction): void {
      // get the user ip
      const ip: string = req.ip;

      let value: number | undefined = RateLimiter.inMemStore.get(ip);

      if (!value) {
        value = RateLimiter.maxRequestsAmount - 1;
      } else {
        value--;
      }

      // update the rate limiter entry
      RateLimiter.inMemStore.set(ip, value);

      if (value < 1) {
        // send failed response
        throw new AppError(RateLimiter.errorMessage, RateLimiter.statusCode);
      } else {
        // set headers & proceed
        res.set("X-Remaining-Requests", value.toString());
        res.set("X-Maximum-Requests", RateLimiter.maxRequestsAmount.toString());
        next();
      }
    };
  }
}

export default RateLimiter;
