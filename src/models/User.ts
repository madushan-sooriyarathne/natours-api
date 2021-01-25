import { Model, Schema, Document, model } from "mongoose";

const userSchema: Schema<UserDocument> = new Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
});

const User: Model<UserDocument> = model("User", userSchema);

export default User;
