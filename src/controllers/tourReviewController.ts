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
import { loginRequired, validateId } from "./middlewares";

import { TypeStrings } from "./decorators/enums/typeStrings";
import Tour from "../models/Tour";

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

    console.log(reviews);

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
  @useAsync(loginRequired())
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
}
