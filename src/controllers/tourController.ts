import { NextFunction, Request, Response, RequestHandler } from "express";
import {
  asyncHandler,
  controller,
  del,
  get,
  patch,
  post,
  put,
  use,
  useAsync,
  validateBody,
  authorizeUsers,
} from "./decorators";
import Tour from "../models/Tour";
import { TypeStrings } from "./decorators/enums/typeStrings";
import { UserTypes } from "./decorators/enums/userTypes";
import APIOperations from "../utils/APIOperations";
import AppError from "../utils/AppError";
import { loginRequired } from "./middlewares";

/**
 * A middleware function to validate tour id
 * it will query the tour for given id and go to next middleware if tour exists or
 * send a failed response if tour doesn't exists
 * @function validateId
 * @async
 * @param {Express.Request} req - Express Request Object
 * @param {Express.Response} res - Express Response object
 * @returns {Promise<void>} - A promise that resolves to void
 */
async function validateId(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.params.id)
    throw new AppError("Invalid request. you must have a id parameter", 404);

  const fetchedTour = await Tour.findById(req.params.id);

  if (!fetchedTour)
    throw new AppError(
      `Invalid tour id. ${req.params.id} does not associate with any existing tours`,
      404
    );

  next();
}

/**
 * Forcefully add limit and sort fields to Request.query object
 * @function getAliasMiddleware
 * @param {number} limit - Number of tours that result should be limited to
 * @param {string} sort - Fields that result should be sorted by
 * @returns {RequestHandler} - the middleware function
 */
function getAliasMiddleware(
  limit = 10,
  sort = "-ratingsAverage,price"
): RequestHandler {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // add given sort and limit values to req.query

    req.query.limit = limit.toString();
    req.query.sort = sort;

    next();
  };
}

/**
 * Handles incoming requests to '/api/v1/tours' route
 * @class
 * @author Madushan Sooriyarathne <madushan.sooriyarathne@outlook.com>
 */
@controller("/api/v1/tours")
class TourController {
  /**
   * Get all tours processed through given filter, sort, limit and paginate rules in query string
   * @function getTours
   * @async
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response object
   * @returns {Promise<void>} - A promise that resolves to void
   */
  @asyncHandler
  @get("/")
  @useAsync(loginRequired)
  async getTours(req: Request, res: Response): Promise<void> {
    const apiOperationQuery = new APIOperations<TourResult, TourDocument>(
      Tour.find(),
      req.query
    );

    // build the result
    const tours = await apiOperationQuery
      .filter()
      .sort()
      .limitFields()
      .paginate().query;

    res
      .status(200)
      .json({ status: "success", count: tours.length, data: tours });
  }

  /**
   * Query first 5 tours that sorted by ratingsAverage (descending order) and price (ascending order)
   * @function getBestBudgetTours
   * @async
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response object
   * @returns {Promise<void>} - A promise that resolves to void
   */
  @asyncHandler
  @get("/best-5-budget-tours")
  @use(getAliasMiddleware(2))
  async getBestBudgetTours(req: Request, res: Response): Promise<void> {
    const apiOpQuery: APIOperations<
      TourResult,
      TourDocument
    > = new APIOperations<TourResult, TourDocument>(Tour.find(), req.query);

    const bestBudgetTorus: TourResult[] = await apiOpQuery
      .filter()
      .sort()
      .limitFields()
      .paginate().query;

    res.status(200).json({
      status: "success",
      count: bestBudgetTorus.length,
      data: bestBudgetTorus,
    });
  }

  /**
   * Send a response with tour statistics that has been generated through a mongoDB aggregation pipeline
   * @function getTourStats
   * @async
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response object
   * @returns {Promise<void>} - A promise that resolves to void
   */
  @asyncHandler
  @get("/tour-stats")
  @useAsync(loginRequired)
  @authorizeUsers(UserTypes.admin, UserTypes.user)
  async getTourStats(req: Request, res: Response): Promise<void> {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gt: 4.0 } },
      },
      {
        $group: {
          _id: "$difficulty",
          numTours: { $sum: 1 },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);

    res.status(200).json({ status: "success", data: stats });
  }

  /**
   * Send a response with tour monthly report statistics that has been generated through a mongoDB aggregation pipeline
   * @function getMonthlyReport
   * @async
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response object
   * @returns {Promise<void>} - A promise that resolves to void
   */
  @asyncHandler
  @get("/monthly-report")
  async getMonthlyReport(req: Request, res: Response): Promise<void> {}

  /**
   * Accept a tour object in request body, persist it in the database (if validation is successful)
   * and send a snapshot of saved document to client
   * @function addTour
   * @async
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response object
   * @returns {Promise<void>} - A promise that resolves to void
   */
  @asyncHandler
  @post("/")
  @validateBody(
    { name: "name", type: TypeStrings.String },
    { name: "difficulty", type: TypeStrings.String },
    { name: "duration", type: TypeStrings.Number },
    { name: "maxGroupSize", type: TypeStrings.Number },
    { name: "price", type: TypeStrings.Number },
    { name: "summery", type: TypeStrings.String },
    { name: "imageCover", type: TypeStrings.String }
  )
  async addTour(req: Request, res: Response): Promise<void> {
    const newTour = await Tour.create({
      ...req.body,
    });

    res.status(201).json({ status: "success", data: newTour });
  }

  /**
   * Accept a part of a tour object in request body, updates that specific tour (if validation is successful)
   * and send a snapshot of updated document to client
   * @function updateTour
   * @async
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response object
   * @returns {Promise<void>} - A promise that resolves to void
   */
  @asyncHandler
  @patch("/:id")
  @useAsync(validateId)
  async updateTour(req: Request, res: Response): Promise<void> {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ status: "success", data: updatedTour });
  }

  /**
   * Accept a full tour object in request body, changes that specific tour (if validation is successful)
   * and send a snapshot of changed document to client
   * @function changeTour
   * @async
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response object
   * @returns {Promise<void>} - A promise that resolves to void
   */
  @asyncHandler
  @put("/:id")
  @useAsync(validateId)
  @validateBody(
    { name: "name", type: TypeStrings.String },
    { name: "difficulty", type: TypeStrings.String },
    { name: "duration", type: TypeStrings.Number },
    { name: "maxGroupSize", type: TypeStrings.Number },
    { name: "price", type: TypeStrings.Number },
    { name: "summery", type: TypeStrings.String },
    { name: "imageCover", type: TypeStrings.String }
  )
  async changeTour(req: Request, res: Response): Promise<void> {
    const changedTour = await Tour.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({ status: "success", data: changedTour });
  }

  /**
   * Delete a specific tour from the database
   * and send a snapshot of changed document to client
   * @function deleteTour
   * @async
   * @param {Express.Request} req - Express Request Object
   * @param {Express.Response} res - Express Response object
   * @returns {Promise<void>} - A promise that resolves to void
   */
  @asyncHandler
  @del("/:id")
  @useAsync(validateId)
  async deleteTour(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({ status: "success", data: null });
  }
}
