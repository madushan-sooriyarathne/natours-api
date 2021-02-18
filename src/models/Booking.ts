import { model, Schema } from "mongoose";

const bookingSchema: Schema<BookingDocument, BookingModel> = new Schema<
  BookingDocument,
  BookingModel
>({
  adults: {
    type: Number,
    required: true,
  },

  children: {
    type: Number,
  },

  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
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
  description: {
    type: String,
    trim: true,
  },
});

const Booking: BookingModel = model("Booking", bookingSchema);

export default Booking;
