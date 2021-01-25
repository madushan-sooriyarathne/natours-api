import { NextFunction, Request, Response } from "express";

import { controller, del, get, patch, post, put } from "./decorators";
import { use } from "./decorators/use";

function validateId(req: Request, res: Response, next: NextFunction): void {
  if (parseInt(req.params.id) === 20) {
    res.status(400).json({ status: "failed", data: null });
    return;
  }
  next();
}

@controller("/api/v1/tours")
class TourController {
  @get("/")
  getTours(req: Request, res: Response): void {
    res.send("you got the tours");
  }

  @post("/")
  addTour(req: Request, res: Response): void {
    res.send("you added a tour");
  }

  @patch("/:id")
  @use(validateId)
  editTour(req: Request, res: Response): void {
    const id: number = parseInt(req.params.id);

    // Tour Object edit login here

    res.send("Entry edited successfully");
  }

  @put("/:id")
  @use(validateId)
  updateTour(req: Request, res: Response): void {
    const id: number = parseInt(req.params.id);

    // tour entry update logic here

    res.send("Tour updated successfully");
  }

  @del("/:id")
  @use(validateId)
  deleteTour(req: Request, res: Response): void {
    const id: number = parseInt(req.params.id);

    // Tour Entry delete logic here

    res.status(204).json({ status: "success", data: null });
  }
}
