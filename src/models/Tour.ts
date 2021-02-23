import {
  Model,
  Schema,
  model,
  Query,
  CallbackError,
  Aggregate,
} from "mongoose";

const tourSchema: Schema<TourDocument, TourModel> = new Schema<
  TourDocument,
  TourModel
>(
  {
    name: {
      type: String,
      required: [true, "a tour must have a name"],
      unique: true,
      maxlength: [40, "the tour name must be less or equal than 40 characters"],
      minlength: [10, "the tour name must have 10 or more characters"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    difficulty: {
      type: String,
      required: [true, "a tour must have a difficulty level"],
      enum: {
        values: ["easy", "medium", "hard"],
        message: "difficulty must be either 'easy', 'medium' or 'hard'",
      },
    },
    duration: {
      type: Number,
      required: [true, "a tour must have a defined duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "a tour must have a group size"],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "rating value must be equal or higher than 1.0"],
      max: [5, "rating value must be equal or lower than 5.0"],
      set: function (val: number): number {
        return Math.round(val * 10) / 10;
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, "a tour must have a price"],
    },

    priceDiscount: {
      type: Number,
      validate: {
        validator: function (this: TourDocument, val: number): boolean {
          return val < this.price;
        },
        message: "discount price ({VALUE}) must be less than the price",
      },
    },
    summery: {
      type: String,
      trim: true,
      required: [true, "a tour must have a summery"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: true,
      validate: {
        validator: function (val: string): boolean {
          return (
            val.endsWith("jpg") || val.endsWith("png") || val.endsWith("webp")
          );
        },
        message: "cover image must be a jpg, png, or webp",
      },
    },
    images: {
      type: [String],
      validate: {
        validator: function (images: string[]): boolean {
          let validated: boolean = true;

          images.forEach((image) =>
            (validated =
              image.endsWith("jpg") ||
              image.endsWith("png") ||
              image.endsWith("webp"))
              ? true
              : false
          );

          return validated;
        },
        message: "image must be a jpg, png or webp",
      },
    },
    guides: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    startLocation: {
      type: {
        type: String,
        default: "Point",
        enum: {
          values: ["Point"],
          message: "startLocation value type must be a Point",
        },
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
    },

    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: {
            values: ["Point"],
            message: "Location value type must be a Point",
          },
        },
        coordinates: {
          type: [Number],
        },
        address: {
          type: String,
        },
        description: {
          type: String,
        },
      },
    ],

    createdAt: {
      type: Date,
      default: new Date(),
      select: false,
    },
    startDates: {
      type: [Date],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// indexes
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

/**
 * Add a virtual value to the query document
 * in order to get virtual fields in the resolved query result
 * toJSON: {virtuals: true} & toObject: {virtuals: true} must be
 * added to the schema
 */
tourSchema.virtual("durationWeeks").get(function (this: TourDocument): number {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tourId",
  localField: "_id",
});

/**
 * Pre save hook / middleware
 * This middleware runs before each document save
 * can be used to add any processed fields to the document
 *
 * FYI: pre save hooks has access to the validated document
 * via this keyword
 */
tourSchema.pre<TourDocument>("save", function (next: () => void): void {
  this.slug = this.name.toLowerCase().split(" ").join("-");
  next();
});

/**
 * Post save hook / middleware
 * This middleware runs after each document save
 * Just log the name of document to the console
 *
 * FYI: post save hooks has access to the saved document
 * via this keyword
 */
tourSchema.post<TourDocument>(
  "save",
  function (_: any, next: () => void): void {
    console.log(`tour saved to database = ${this.name}`);
    next();
  }
);

/**
 * Pre Query Hook / Middleware
 * This middleware run before every database query
 * It exclude any secretTours that has been queried from initial query
 * and set startTime property in query object to calculate elapsed time
 * in Post query hook
 */
tourSchema.pre<Query<TourDocument[], TourDocument>>(
  /^find/,
  function (next: (err: CallbackError) => void): void {
    this.find({ secretTour: { $ne: true } });
    (this as { [key: string]: any }).startTime = Date.now();
    next(null);
  }
);

/**
 * Post Query Hook / Middleware
 * This middleware runs after every database query
 * extract the startTime value added from Pre Query hook
 * and calculate the time elapsed for the query
 */
tourSchema.post<Query<TourDocument[], TourDocument>>(
  /^find/,
  function (res: TourDocument[], next: (err: CallbackError) => void): void {
    console.log(
      `query executed in ${
        Date.now() - (this as { [key: string]: any }).startTime
      } milliseconds`
    );

    next(null);
  }
);

/**
 * Pre Aggregator hook / middleware
 * this middleware runs before any data aggregation pipeline.
 * Add another match selector to the pipeline to exclude
 * secretTours in aggregation results
 */
tourSchema.pre<Aggregate<any>>(
  "aggregate",
  function (next: (error: CallbackError) => void): void {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

    this.pipeline().forEach((item, index) => {
      if (Object.keys(item)[0] === "$geoNear") {
        this.pipeline().unshift(this.pipeline()[index]);
        this.pipeline().splice(index + 1, 1);
      }
    });

    next(null);
  }
);

// Tour Model
const Tour: TourModel = model("Tour", tourSchema);

export default Tour;
