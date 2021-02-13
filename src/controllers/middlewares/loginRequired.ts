import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";
import { promisify } from "util";
import User from "../../models/User";

import AppError from "../../utils/AppError";

async function loginRequired(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.headers.authorization)
    throw new AppError("No Auth Headers", 401, "failed");

  const authHeaderProperties: string[] = req.headers.authorization.split(" ");

  // Token must be set with Bearer flag in Authorization headers
  // NOTE: if jwt was not provided with Bearer flag, It will render as 'null' (typeof string)
  if (
    authHeaderProperties[0] !== "Bearer" ||
    !authHeaderProperties[1] ||
    authHeaderProperties[1] === "null"
  )
    throw new AppError(
      "Cannot find the access token in the request headers - authorization failed",
      401,
      "failed"
    );

  // verify the token
  const verifiedJWTData = await promisify<string, string, object | undefined>(
    jwt.verify
  )(authHeaderProperties[1], process.env.AUTH_SALT as string);

  // Fetch the user from db (with the password)
  const currentUser: UserDocument | null = await User.findOne({
    _id: (verifiedJWTData as VerifiedJWTResult).userId,
  }).select("+password");

  if (!currentUser)
    throw new AppError(
      "the user belonging the token does not exists",
      401,
      "failed"
    );

  // check if the user has changed the password
  if (
    currentUser.hasChangedPassword((verifiedJWTData as VerifiedJWTResult).exp)
  )
    throw new AppError(
      "User has recently changed the password. Please login again!",
      401,
      "failed"
    );

  (req as { [key: string]: any }).user = currentUser;

  next();
}

export { loginRequired };
