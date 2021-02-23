import { model, Schema, Query, CallbackError } from "mongoose";
import Tour from "./Tour";

const reviewSchema: Schema<ReviewDocument, ReviewModel> = new Schema<
  ReviewDocument,
  ReviewModel
>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [30, "Review title must be less than 30 characters"],
    minlength: [10, "Review title must be more than 10 characters"],
  },
  body: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    min: [0.0, "Rating score must be higher than 0.0"],
    max: [5.0, "Rating score must be lower than 5.0"],
  },
  date: {
    type: Date,
    default: new Date(),
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },

  tourId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Tour",
  },
});

// Indexes
// defined a unique compound index for userId & TourId
// which means one userId can only write one unique review for each tour
reviewSchema.index({ tourId: 1, userId: 1 }, { unique: true });

// static method to populate tour's ratings
reviewSchema.statics.updateTourReviewStats = async function (
  tourId: Schema.Types.ObjectId
): Promise<void> {
  const aggregateResult: ReviewAggregationResult[] = await this.aggregate([
    {
      $match: { tourId: tourId },
    },
    {
      $group: {
        _id: "$tourId",
        ratingsCount: { $sum: 1 },
        ratingsAverage: { $avg: "$rating" },
      },
    },
  ]);

  // Update tour's ratingsAverage & ratingsQuantity fields
  if (aggregateResult.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: aggregateResult[0].ratingsAverage,
      ratingsQuantity: aggregateResult[0].ratingsCount,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: aggregateResult[0].ratingsAverage,
      ratingsQuantity: aggregateResult[0].ratingsCount,
    });
  }
};

// pre query hook to get reviewDocument when review is deleted or updated
reviewSchema.pre<Query<ReviewDocument[], ReviewDocument>>(
  /^findOneAnd/,
  async function (next: (err: CallbackError) => void): Promise<void> {
    const currentDocument: ReviewDocument | null = await this.findOne();

    // attach currentDocument to the query
    (this as any).currentDocument = currentDocument;

    next(null);
  }
);

// post query hook to update the tour's review stats when a review updated or deleted
reviewSchema.post<Query<ReviewDocument[], ReviewDocument>>(
  /^findOneAnd/,
  async function (
    res: ReviewDocument[],
    next: (err: CallbackError) => void
  ): Promise<void> {
    // get the review document from the query
    await ((this as any).currentDocument
      .constructor as ReviewModel).updateTourReviewStats(
      (this as any).currentDocument.tourId
    );

    next(null);
  }
);

reviewSchema.post<Query<ReviewDocument[], ReviewDocument>>(
  /^delete$/,
  async function (res: ReviewDocument[], next: (err: CallbackError) => void) {
    await ((this as any).currentDocument
      .constructor as ReviewModel).updateTourReviewStats(
      (this as any).currentDocument.tourId
    );

    next(null);
  }
);

// post hook to update the tour's review stats on new reviews being added
reviewSchema.post("save", async function () {
  await (this.constructor as ReviewModel).updateTourReviewStats(this.tourId);
});

const Review: ReviewModel = model("Review", reviewSchema);

export default Review;
