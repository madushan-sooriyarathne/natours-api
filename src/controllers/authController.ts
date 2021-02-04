import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import User from "../models/User";
import AppError from "../utils/AppError";

import { controller, post, validateBody } from "./decorators";
import { TypeStrings } from "./decorators/enums/typeStrings";

function getSignedAccessToken(userId: string): string {
  return jwt.sign({ userId }, process.env.AUTH_SALT as string);
}

@controller("/api/v1/auth")
class AuthController {
  @post("/register")
  @validateBody(
    { name: "username", type: TypeStrings.String },
    { name: "name", type: TypeStrings.String },
    { name: "email", type: TypeStrings.String },
    { name: "password", type: TypeStrings.String },
    { name: "confirmPassword", type: TypeStrings.String }
  )
  async registerUser(req: Request, res: Response): Promise<void> {
    const user = await User.create(req.body);
    console.log(user);

    // create the JWT token
    const accessToken: string = getSignedAccessToken(user._id);

    res.status(201).json({ status: "success", data: user, token: accessToken });
  }

  @post("/login")
  @validateBody(
    { name: "email", type: TypeStrings.String },
    { name: "password", type: TypeStrings.String }
  )
  async loginUser(req: Request, res: Response): Promise<void> {
    // Get the user from db and validate the password
    const user: UserDocument | null = await User.findOne({
      email: req.body.email,
    }).select("+password");

    if (!user || !(await user.verifyPassword(req.body.password))) {
      throw new AppError("Invalid Email or Password", 401);
    }

    const accessToken: string = getSignedAccessToken(user._id);

    res.status(202).json({ status: "success", token: accessToken });
  }
}
