import { Request, Response } from "express";

import Tour from "../models/Tour";
import Review from "../models/Review";

import {
  asyncHandler,
  controller,
  del,
  get,
  patch,
  post,
  useAsync,
  validateBody,
} from "./decorators";
import { loginRequired, validateId } from "./middlewares";
import { TypeStrings } from "./decorators/enums/typeStrings";
import AppError from "../utils/AppError";
import { UserTypes } from "./decorators/enums/userTypes";
import { Schema } from "mongoose";

@controller("/api/v1/tours")
class TourReviewController {
  /**
   * Get all reviews for given tour
   * @function getTourReviews
   * @async
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response object
   * @returns {Promise<void>} - A promise that resolves to void
   */
  @asyncHandler
  @get("/:id/reviews")
  @useAsync(validateId(Tour))
  async getTourReviews(req: Request, res: Response): Promise<void> {
    const reviews: ReviewDocument[] = await Review.find({
      tourId: req.params.id,
    });

    // send result to the client
    res.status(200).json({ status: "success", data: reviews });
  }

  /**
   * Add a review to given tour
   * @function addTourReview
   * @async
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response object
   * @returns {Promise<void>} - A promise that resolves to void
   */
  @asyncHandler
  @post("/:id/reviews")
  @useAsync(validateId(Tour))
  @useAsync(loginRequired(UserTypes.user))
  @validateBody(
    { name: "title", type: TypeStrings.String },
    { name: "rating", type: TypeStrings.Number }
  )
  async addTourReview(req: Request, res: Response): Promise<void> {
    const userId: string = (req as CustomRequest).user._id;
    const tourId: string = req.params.id;

    // addd new review for current tour
    const newReview = await Review.create({ userId, tourId, ...req.body });

    // send the result to client
    res.status(200).json({ status: "success", data: newReview });
  }

  @asyncHandler
  @get("/:id/reviews/:reviewId")
  @useAsync(validateId(Tour))
  async getOneReview(req: Request, res: Response): Promise<void> {
    // get the review
    const review: ReviewDocument | null = await Review.findOne({
      _id: req.params.reviewId,
      tourId: req.params.id,
    });

    if (!review)
      throw new AppError(
        `tour ${req.params.id} does not have a review with id ${req.params.reviewId}`,
        404
      );

    res.status(200).json({ status: "success", data: review });
  }

  @asyncHandler
  @patch("/:id/reviews/:reviewId")
  @useAsync(validateId(Tour))
  @useAsync(loginRequired(UserTypes.user))
  async updateTourReview(req: Request, res: Response): Promise<void> {
    const updatedReview: ReviewDocument | null = await Review.findByIdAndUpdate(
      req.params.reviewId,
      req.body
    );

    if (!updatedReview)
      throw new AppError(
        "a review with that reviewId does not exists",
        404,
        "failed"
      );

    res.status(200).json({ status: 200, data: updatedReview });
  }

  @asyncHandler
  @del("/:id/reviews/:reviewId")
  @useAsync(validateId(Tour))
  @useAsync(loginRequired(UserTypes.user, UserTypes.admin))
  async deleteTourReview(req: Request, res: Response): Promise<void> {
    const currentUser: UserDocument = (req as CustomRequest).user;

    const doc: ReviewDocument | null = await Review.findOneAndDelete({
      _id: req.params.reviewId,
      tourId: req.params.id,
      userId: currentUser._id,
    });

    if (!doc)
      throw new AppError(
        `cannot find a review with id ${req.params.reviewId} in tour ${req.params.id} that belongs to user with id ${currentUser._id}`,
        404
      );

    res.status(204).json({ status: "success", data: null });
  }
}
