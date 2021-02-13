import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import User from "../models/User";
import AppError from "../utils/AppError";
import Mailer from "../utils/Mailer";
import { isEmail } from "../utils/stringValidators";

import {
  controller,
  post,
  patch,
  validateBody,
  asyncHandler,
  useAsync,
  use,
} from "./decorators";
import { TypeStrings } from "./decorators/enums/typeStrings";
import { loginRequired } from "./middlewares";

// TODO - add refresh token mechanism with redis store to expire the refresh tokens

/**
 * @function getSignedAccessToken - Takes the unique id of the user and
 * returns a signed jwt token with user id in the encrypted payload
 * @param {string} userId - Mongoose unique id of the user
 * @returns {string} - Signed JWT access token
 */
function getSignedAccessToken(userId: string): string {
  return jwt.sign({ userId }, process.env.AUTH_SALT as string, {
    expiresIn: "15m",
  });
}

/**
 * @class Main controller for all auth route end points
 */
@controller("/api/v1/auth")
class AuthController {
  /**
   * User registration route.
   * username, name, email, password & confirmPassword fields
   * must present in the request body
   * @async
   * @function
   * @param {Express.Request} req - Express request object
   * @param {Express.Response} res - Express response object
   */
  @asyncHandler
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

    // create the JWT token
    const accessToken: string = getSignedAccessToken(user._id);

    // TODO: Clear the user body before sending back to client

    res.status(201).json({ status: "success", data: user, token: accessToken });
  }

  /**
   * User login route.
   * email & password fields must present in the request body
   * @async
   * @function
   * @param {Express.Request} req - Express request object
   * @param {Express.Response} res - Express response object
   */
  @asyncHandler
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

  /**
   * forgot-password route.
   * email field must be present in the request body.
   * send the password reset email to the given email only
   * if a user exists with the given email
   * @async
   * @function
   * @param {Express.Request} req - Express request object
   * @param {Express.Response} res - Express response object
   */
  @asyncHandler
  @post("/forgot-password")
  @validateBody({
    name: "email",
    type: TypeStrings.String,
    validators: [isEmail],
  })
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const user: UserDocument | null = await User.findOne({
      email: req.body.email,
    });

    if (!user)
      throw new AppError(
        `There is no user associated with ${req.body.email}`,
        404,
        "failed"
      );

    const passwordResetToken: string = user.getPasswordResetToken();

    // save the user
    await user.save({ validateBeforeSave: false });

    // explicitly catch error on sending email & revoke password reset token if any error occurs
    try {
      // send password reset email
      await Mailer.sendEmail(
        Mailer.generatePasswordResetEmailObj(req.body.email, passwordResetToken)
      );
    } catch (error: any) {
      user.resetTokenExpiresAt = undefined;
      user.passwordResetToken = undefined;
      await user.save({ validateBeforeSave: false });

      // throw new app error
      throw new AppError(
        "Error sending the password reset email. Internal server error",
        500
      );
    }

    // send success response to user
    res.status(200).json({
      status: "success",
      message: "password reset email has been sent",
    });
  }

  /**
   * Reset Password route.
   * password & confirmPassword fields must be present in the request body.
   * Also, Password reset token must be included in query string with 'reset' identifier
   * If the reset token is valid and not expired, change the user's password with
   * given password after db validation
   * @async
   * @function
   * @param {Express.Request} req - Express request object
   * @param {Express.Response} res - Express response object
   */
  @asyncHandler
  @patch("/reset-password")
  @validateBody(
    { name: "newPassword", type: TypeStrings.String },
    { name: "confirmNewPassword", type: TypeStrings.String }
  )
  async resetPassword(req: Request, res: Response): Promise<void> {
    if (!req.query.reset)
      throw new AppError("No password reset token", 401, "failed");

    const hashedToken = User.generateHashedToken(req.query.reset as string);

    const user: UserDocument | null = await User.findOne({
      passwordResetToken: hashedToken,
    }).select("+resetTokenExpiresAt");

    if (!user)
      throw new AppError("Cannot find a user for given token", 404, "failed");

    if (user.resetTokenExpiresAt && user.resetTokenExpiresAt < Date.now())
      throw new AppError("Password reset token expired!", 401, "failed");

    user.password = req.body.newPassword;
    user.confirmPassword = req.body.confirmNewPassword;

    // Manually delete passwordResetToken and resetTokenExpiresAt values
    user.passwordResetToken = undefined;
    user.resetTokenExpiresAt = undefined;

    // save the updated user in the database after data validation
    await user.save();

    // create a new jwt token
    const jwtToken: string = getSignedAccessToken(user._id);

    res.status(200).json({
      status: "success",
      message: "password updated successfully",
      token: jwtToken,
    });
  }

  /**
   * Update Password route.
   * User must be logged in to use this route / functionality.
   * previous, password & confirmPassword fields must be present in the request body.
   * @async
   * @function
   * @param {Express.Request} req - Express request object
   * @param {Express.Response} res - Express response object
   */
  @asyncHandler
  @post("/update-password")
  @useAsync(loginRequired)
  @validateBody(
    {
      name: "previousPassword",
      type: TypeStrings.String,
    },
    { name: "newPassword", type: TypeStrings.String },
    { name: "confirmNewPassword", type: TypeStrings.String }
  )
  async updatePassword(req: Request, res: Response): Promise<void> {
    // throw an error if  password or confirmPassword data present in the request body
    if (req.body.password || req.body.confirmPassword)
      throw new AppError(
        `Cannot update the passwords here. Please use ${req.httpVersion}://${req.hostname}/api/v1/auth/update-password to update the password`,
        406
      );

    // get the current user
    const currentUser: UserDocument = (req as { [key: string]: any }).user;

    // check the previous password
    const passwordVerified: boolean = await currentUser.verifyPassword(
      req.body.previousPassword
    );

    if (!passwordVerified)
      throw new AppError("Previous password is incorrect.", 401, "failed");

    // update the password
    currentUser.password = req.body.newPassword;
    currentUser.confirmPassword = req.body.confirmNewPassword;

    // save user after validations
    // password validation errors to be captured and handled in User model itself
    await currentUser.save();

    // login user by sending a new auth token
    const accessToken: string = getSignedAccessToken(currentUser._id);

    // send the token with a success response
    res.status(200).json({
      status: "success",
      message: "Password successfully updated!",
      token: accessToken,
    });
  }

  /**
   * Delete User route.
   * User must be logged in to use this route / functionality.
   * password field must present in the request body.
   * @async
   * @function
   * @param {Express.Request} req - Express request object
   * @param {Express.Response} res - Express response object
   */
  @asyncHandler
  @post("/delete-user")
  @useAsync(loginRequired)
  @validateBody({ name: "password", type: TypeStrings.String })
  async deleteUser(req: Request, res: Response): Promise<void> {
    // get the logged in user from request object
    const currentUser: UserDocument = (req as { [key: string]: any }).user;

    // validate current user with provided password
    const isUserValidated: boolean = await currentUser.verifyPassword(
      req.body.password
    );

    if (!isUserValidated)
      throw new AppError("Cannot validate the user with give password", 401);

    // delete the user from db
    currentUser.deleteOne();

    // send the success response to the client with no  content
    res.status(204).json({
      status: "success",
      message: "user successfully deleted!",
      data: null,
    });
  }
}
