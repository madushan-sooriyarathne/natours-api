import { NextFunction, RequestHandler, Request, Response } from "express";

type ReqBody = { [key: string]: any };

function filterRequestBody(...fields: string[]): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction): void {
    const updatedRequestBody: ReqBody = {};

    Object.keys(req.body).forEach((item: string) => {
      if (fields.includes(item)) {
        updatedRequestBody[item] = req.body[item];
      }
    });

    req.body = updatedRequestBody;

    next();
  };
}

export { filterRequestBody };
