import { Request, Response, NextFunction } from "express";
import { Document, Model, Schema, Types } from "mongoose";
import { NoSubstitutionTemplateLiteral } from "typescript";
import { TypeStrings } from "./src/controllers/decorators/enums/typeStrings";

declare global {
  type ValidatorFunctionType = (str: string) => [boolean, string];

  type CustomRequest = { [key: string]: any };

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
    tours: [Schema.Types.ObjectId];
  }

  interface UserDocument extends User, Document {
    verifyPassword: (candidatePassword: string) => Promise<boolean>;
    hasChangedPassword: (expAt: number) => boolean;
    getPasswordResetToken: () => string;
    changedPasswordAt?: Date;
    passwordResetToken?: string;
    resetTokenExpiresAt?: number;
    tours: Types.Array<Schema.Types.ObjectId>;
  }

  // For static methods
  interface UserModel extends Model<UserDocument> {
    generateHashedToken(token: string): string;
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
    guides?: [Schema.Types.ObjectId];
    startLocation?: {
      type: string;
      coordinates: [number];
      address?: string;
      description?: string;
    };
    locations?: [
      {
        type: string;
        coordinates: [number];
        address?: string;
        description?: string;
      }
    ];
  }

  interface TourDocument extends Tour, Document {
    images?: Types.Array<string>;
    startDate?: Types.Array<Date>;
    guides: Types.Array<Schema.Types.ObjectId>;

    // virtuals
    durationWeeks?: number;
    reviews?: ReviewDocument[];
  }

  interface TourModel extends Model<TourDocument> {
    // static methods here
  }

  interface Review {
    title: string;
    body?: string;
    rating: number;
    userId: string;
    tourId: string;
    date: Date;
  }

  interface ReviewDocument extends Document, Review {
    // virtuals, methods & mongoose special types here
    userId: Types.ObjectId;
    tourId: Types.ObjectId;
  }

  interface ReviewModel extends Model<ReviewDocument> {
    // statics here
  }

  interface Booking {
    adults: number;
    children?: number;
    startDate: Date;
    endDate: Date;
    userId: string;
    tourId: string;
    description?: string;
  }

  interface BookingDocument extends Booking, Document {
    userId: Types.ObjectId;
    tourId: Types.ObjectId;
  }

  interface BookingModel extends Model<BookingDocument> {
    // statics here
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
