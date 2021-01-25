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

@controller("/api/v1/users")
class UserController {
  @get("/")
  getAllUsers(req: Request, res: Response): void {
    res.send("You got all the users");
  }

  @post("/")
  @validateBody("name", "age")
  async addUser(req: Request, res: Response) {
    User.create({ name: req.body.name, age: req.body.age })
      .then((user: UserDocument) => user.save())
      .then(({ errors }) => {
        if (errors) {
          res.status(504).json({
            status: "failed",
            message: "Error saving the user in DB",
            data: null,
          });
          return;
        }
        res.status(200).json({ status: "success", message: "User saved" });
      });
  }

  @patch("/:id")
  updateUser(req: Request, res: Response): void {
    res.send("User Updated successfully");
  }

  @put("/:id")
  changeUser(req: Request, res: Response): void {
    res.send("User changed");
  }

  @del("/:id")
  deleteUser(req: Request, res: Response): void {
    res.send("User Removed");
  }
}
