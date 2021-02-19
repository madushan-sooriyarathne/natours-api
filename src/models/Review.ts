import { model, Schema } from "mongoose";

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

const Review: ReviewModel = model("Review", reviewSchema);

export default Review;
