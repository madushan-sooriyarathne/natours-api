import { Model, Schema, model } from "mongoose";

const userSchema: Schema<UserDocument> = new Schema({
  name: {
    type: String,
    required: [true, "a user object must have a name field"],
    unique: [true, "name should be a unique value"],
  },
  age: {
    type: Number,
    required: [true, "a user object must have an age field"],
  },
  finishedTours: {
    type: Array,
  },
  ongoingTours: {
    type: Array,
  },
  upcomingTours: {
    type: Array,
  },
});

const User: Model<UserDocument> = model("User", userSchema);

export default User;
