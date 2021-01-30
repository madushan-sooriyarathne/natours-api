import mongoose, { Model, Schema, model } from "mongoose";

const tourSchema: Schema<TourDocument> = new Schema({
  name: {
    type: String,
    required: [true, "a tour must have a name"],
    unique: [true, "tour name has to be unique"],
  },
  price: {
    type: Number,
    required: [true, "a tour must have a price"],
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  difficulty: {
    type: String,
    required: [true, "a tour must have a difficulty level"],
  },
  duration: {
    type: Number,
    required: [true, "a tour must have a defined duration"],
  },
  maxGroupSize: {
    type: Number,
  },
});

const Tour: Model<TourDocument> = model("Tour", tourSchema);

export default Tour;
