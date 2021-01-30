import { NextFunction, Request, Response } from "express";

import {
  controller,
  del,
  get,
  patch,
  post,
  put,
  use,
  validateBody,
} from "./decorators";
import Tour from "../models/Tour";
import { TypeStrings } from "./decorators/enums/typeStrings";
import { Query } from "mongoose";
import APIOperations from "../utils/APIOperations";

async function validateId(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.params.id) {
    res.status(400).json({ status: "failed", message: "invalid request" });
    return;
  }

  try {
    const fetchedTour = await Tour.findById(req.params.id);
    console.log(req.params.id);
    console.log(fetchedTour);
    if (!fetchedTour) {
      res.status(404).json({ status: "failed", message: "invalid tour id" });
      return;
    }
    next();
  } catch (error: any) {
    res.status(400).json({ status: "failed", message: "invalid request" });
  }
}

@controller("/api/v1/tours")
class TourController {
  @get("/")
  async getTours(req: Request, res: Response): Promise<void> {
    try {
      const apiOperationQuery = new APIOperations<TourDocument, TourDocument>(
        Tour.find(),
        req.query
      );

      // build the result
      const tours: TourDocument[] = await apiOperationQuery
        .filter()
        .sort()
        .limitFields()
        .paginate().query;
      console.log(tours);

      res
        .status(200)
        .json({ status: "success", count: tours.length, data: tours });
    } catch (error: any) {
      res.status(404).json({ status: "failed", message: error.message });
    }
  }

  @post("/")
  @validateBody(
    { name: "name", type: TypeStrings.String },
    { name: "price", type: TypeStrings.Number },
    { name: "difficulty", type: TypeStrings.String },
    { name: "duration", type: TypeStrings.Number }
  )
  async addTour(req: Request, res: Response): Promise<void> {
    try {
      const newTour = await Tour.create({
        name: req.body.name,
        price: req.body.price,
        rating: req.body.rating,
        difficulty: req.body.difficulty,
        duration: req.body.duration,
        maxGroupSize: req.body.maxGroupSize,
      });

      res.status(201).json({ status: "success", data: newTour });
    } catch (error: any) {
      res.status(500).json({ status: "failed", message: error.message });
    }
  }

  @patch("/:id")
  @use(validateId)
  async editTour(req: Request, res: Response): Promise<void> {
    try {
      const updatedTour = await Tour.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.status(200).json({ status: "success", data: updatedTour });
    } catch (error: any) {
      res.status(500).json({ status: "failed", message: error.message });
    }
  }

  @put("/:id")
  @use(validateId)
  @validateBody(
    { name: "name", type: TypeStrings.String },
    { name: "price", type: TypeStrings.Number },
    { name: "difficulty", type: TypeStrings.String },
    { name: "duration", type: TypeStrings.Number }
  )
  async updateTour(req: Request, res: Response): Promise<void> {
    try {
      const changedTour = await Tour.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          price: req.body.price,
          rating: req.body.rating,
          difficulty: req.body.difficulty,
          duration: req.body.duration,
          maxGroupSize: req.body.maxGroupSize,
        },
        { new: true, runValidators: true }
      );

      res.status(200).json({ status: "success", data: changedTour });
    } catch (error: any) {
      res.status(500).json({ status: "failed", message: error.message });
    }
  }

  @del("/:id")
  @use(validateId)
  async deleteTour(req: Request, res: Response): Promise<void> {
    try {
      await Tour.findByIdAndDelete(req.params.id);

      res.status(204).json({ status: "success", data: null });
    } catch (error: any) {
      res.status(200).json({ status: "failed", message: error.message });
    }

    res.status(204).json({ status: "success", data: null });
  }
}
