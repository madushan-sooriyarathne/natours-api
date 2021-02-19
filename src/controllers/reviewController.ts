import { Request, Response } from "express";

import Review from "../models/Review";
import {
  asyncHandler,
  controller,
  get,
  post,
  useAsync,
  validateBody,
} from "./decorators";
import { TypeStrings } from "./decorators/enums/typeStrings";
import { loginRequired } from "./middlewares";

@controller("/api/v1/review")
class ReviewController {
  @asyncHandler
  @get("/")
  async getAllReviews(req: Request, res: Response): Promise<void> {
    // get the reviews
    // use APIOperations to filter the query

    const reviews: ReviewDocument[] = await Review.find().populate([
      { path: "tourId", select: "name" },
      { path: "userId", select: "photo name username" },
    ]);

    // send the reviews to client
    res
      .status(200)
      .json({ status: "success", count: reviews.length, data: reviews });
  }

  @asyncHandler
  @post("/")
  @useAsync(loginRequired())
  @validateBody(
    { name: "title", type: TypeStrings.String },
    { name: "rating", type: TypeStrings.Number },
    { name: "tourId", type: TypeStrings.String }
  )
  async addReview(req: Request, res: Response): Promise<void> {
    // get the current user id;
    const userId: string = (req as CustomRequest).user._id;

    // crate a new review
    const newReview: ReviewDocument = await Review.create({
      userId,
      ...req.body,
    });

    // send the new review to client
    res.status(201).json({
      status: "success",
      message: "review successfully created",
      data: newReview,
    });
  }
}
