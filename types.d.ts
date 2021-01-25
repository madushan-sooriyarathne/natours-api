import { Request, Response, NextFunction } from "express";
import { Document } from "mongoose";

declare global {
  interface MiddlewareHandler {
    req: Request;
    res: Response;
    next: NextFunction;
  }

  interface RequestResponseHandler {
    req: Request;
    res: Response;
  }

  interface validatorRules {
    name: string;
    type: string;
  }

  interface UserInterface extends Document {
    name: string;
    age: number;
  }

  type UserDocument = Document<UserInterface>;
}
