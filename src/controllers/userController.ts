import { Response, Request } from "express";
import User from "../models/User";
import {
  authorizeUsers,
  controller,
  get,
  patch,
  use,
  useAsync,
} from "./decorators";
import { UserTypes } from "./decorators/enums/userTypes";
import { filterRequestBody, loginRequired } from "./middlewares";

// function filterRequestBody(
//   body: { [key: string]: any },
//   ...fields: string[]
// ): { [key: string]: any } {
//   const newBodyObject: { [key: string]: any } = {};

//   Object.keys(body).forEach((key: string) => {
//     if (fields.includes(key)) newBodyObject[key] = body[key];
//   });

//   return newBodyObject;
// }

@controller("/api/v1/users")
class UserController {
  @get("/")
  @useAsync(loginRequired)
  @authorizeUsers(UserTypes.admin)
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.find();

      res.status(200).json({ status: "success", data: users });
      return;
    } catch (error: unknown) {
      res
        .status(503)
        .json({ status: "failed", message: "internal server error" });
      return;
    }
  }

  @patch("/update-user")
  @useAsync(loginRequired)
  @use(filterRequestBody("name", "username", "email"))
  async updateUser(req: Request, res: Response): Promise<void> {
    console.log(req.body);

    // get the current user from request object
    const currentUser: UserDocument = (req as { [key: string]: any }).user;

    // update the user
    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      req.body,
      { new: true, runValidators: true }
    );

    // send the success response along with the updated user object
    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: updatedUser,
    });
  }
}
