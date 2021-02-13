import { Request, Response, NextFunction } from "express";
import { Document, Model, Types } from "mongoose";
import { NoSubstitutionTemplateLiteral } from "typescript";
import { TypeStrings } from "./src/controllers/decorators/enums/typeStrings";

declare global {
  // type UserTypes = _UserTypes;

  // interface MiddlewareHandler {
  //   req: Request;
  //   res: Response;
  //   next: NextFunction;
  // }

  // interface RequestResponseHandler {
  //   req: Request;
  //   res: Response;
  // }

  type ValidatorFunctionType = (str: string) => [boolean, string];

  interface validatorRules {
    name: string;
    type: TypeStrings;
    validators?: ValidatorFunctionType[];
  }

  interface User {
    username: string;
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    photo?: string;
    userType: string;
  }

  interface UserDocument extends User, Document {
    verifyPassword: (candidatePassword: string) => Promise<boolean>;
    hasChangedPassword: (expAt: number) => boolean;
    getPasswordResetToken: () => string;
    changedPasswordAt?: Date;
    passwordResetToken?: string;
    resetTokenExpiresAt?: number;
  }

  interface UserModel extends Model<UserDocument> {
    generateHashedToken(token: string): string;
  }

  interface UserResult extends User {
    // if there's any virtuals, add here
  }

  interface Tour {
    name: string;
    slug: string;
    duration: number;
    maxGroupSize: number;
    difficulty: string;
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
