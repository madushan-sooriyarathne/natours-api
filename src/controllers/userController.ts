import { Response, Request } from "express";
import User from "../models/User";
import {
  controller,
  del,
  get,
  patch,
  post,
  put,
  validateBody,
} from "./decorators";
import { TypeStrings } from "./decorators/enums/typeStrings";

@controller("/api/v1/users")
class UserController {
  @get("/")
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

  @post("/")
  @validateBody(
    { name: "name", type: TypeStrings.String },
    { name: "age", type: TypeStrings.Number }
  )
  async addUser(req: Request, res: Response): Promise<void> {
    try {
      console.log("newUser");
      // create new user in the db
      const newUser = await User.create({
        name: req.body.name,
        age: req.body.age,
      });

      // if no exceptions are thrown, send success response
      res.status(200).json({ status: "success", data: newUser });
    } catch (error: any) {
      res.status(503).json({ status: "failed", message: error.message });
    }
  }

  @get("/:id")
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.params.id);

      res.status(200).json({ status: "success", data: user });
    } catch (error: any) {
      res.status(404).json({ status: "failed", message: "User not found!" });
    }
  }

  @patch("/:id")
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.status(200).json({ status: "success", data: updatedUser });
    } catch (error: any) {
      res.status(500).json({ status: "failed", message: error.message });
    }

    res.send("User Updated successfully");
  }

  @put("/:id")
  @validateBody(
    { name: "name", type: TypeStrings.String },
    { name: "age", type: TypeStrings.Number }
  )
  async changeUser(req: Request, res: Response): Promise<void> {
    try {
      const changedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          age: req.body.age,
        },
        { new: true, runValidators: true }
      );

      res.status(200).json({ status: "success", data: changedUser });
    } catch (error: any) {
      res.status(503).json({ status: "failed", message: error.message });
    }
  }

  @del("/:id")
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      await User.findByIdAndDelete(req.params.id);

      res.status(204).json({ status: "success", data: null });
    } catch (error: any) {
      res.status(503).json({ status: "failed", message: error.message });
    }
  }
}
