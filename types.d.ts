import { Request, Response, NextFunction } from "express";
import { Document, Types } from "mongoose";
import { NoSubstitutionTemplateLiteral } from "typescript";
import { TypeStrings } from "./src/controllers/decorators/enums/typeStrings";

enum DifficultyLevels {
  easy = "easy",
  medium = "medium",
  hard = "hard",
}

enum UserTypes {
  user = "user",
  moderator = "moderator",
  admin = "admin",
}

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

  interface User {
    username: string;
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    photo?: string;
    userType: UserTypes;
  }

  interface UserDocument extends User, Document {
    verifyPassword: (candidatePassword: string) => Promise<boolean>;
    hasChangedPassword: (expAt: number) => boolean;
    changedPasswordAt?: Date;
  }

  interface UserResult extends User {
    // if there's any virtuals, add here
  }

  interface Tour {
    name: string;
    slug: string;
    duration: number;
    maxGroupSize: number;
    difficulty: DifficultyLevels;
    price: number;
    summery: string;
    imageCover: string;
    images?: string[];
    createdAt?: Date;
    startDates?: Date[];
    description?: number;
    priceDiscount?: number;
    ratingsAverage?: number;
    ratingsQuantity?: number;
    secretTour?: boolean;
  }

  interface TourDocument extends Tour, Document {
    images?: Types.Array<string>;
    startDate?: Types.Array<Date>;
  }

  interface TourResult extends Tour {
    durationWeeks?: number;
  }

  interface AliasRouteOptions {
    limit: number;
    sort: string;
  }

  interface VerifiedJWTResult {
    userId: string;
    iat: number;
    exp: number;
  }

  type AsyncRequestHandler = (
    req: Request,
    res: Response,
    next?: NextFunction
  ) => Promise<void>;
  type SyncRequestHandler = (
    req: Request,
    res: Response,
    next?: NextFunction
  ) => void;
}
