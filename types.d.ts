import { Request, Response, NextFunction } from "express";
import { Document } from "mongoose";
import { NoSubstitutionTemplateLiteral } from "typescript";
import { TypeStrings } from "./src/controllers/decorators/enums/typeStrings";

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
    type: TypeStrings;
  }

  interface UserDocument extends Document {
    name: string;
    age: number;
    finishedTours: [];
    ongoingTours: [];
    upcomingTours: number;
  }

  interface TourDocument extends Document {
    name: string;
    price: number;
    rating: number;
    difficulty: string;
    duration: number;
    maxGroupSize?: number;
  }

  interface AliasRouteOptions {
    limit: number;
    sort: string;
  }
}
