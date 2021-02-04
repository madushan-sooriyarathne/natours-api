import bcyrpt from "bcrypt";
import { Model, Schema, model } from "mongoose";

const userSchema: Schema<UserDocument> = new Schema({
  username: {
    type: String,
    required: [true, "a user must have a username"],
    unique: [true, "a user with username {VALUE} already exists!"],
    minlength: [5, "a username must have minimum 5 characters"],
    maxlength: [20, "a username must be equal or lower than 20 characters"],
  },
  name: {
    type: String,
    trim: true,
    required: [true, "a user object must have a name field"],
    minlength: [10, "the name must be 10 characters or long"],
    maxlength: [40, "the name must be equal or less than 40 characters"],
  },
  email: {
    type: String,
    required: [true, "a user object must have an email"],
    unique: [true, "a user with email {VALUE} already exists"],
    match: /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
  },
  password: {
    type: String,
    required: [true, "a user must have a password"],
    minlength: [8, "password must be at least 8 characters long"],
    select: false,
  },

  confirmPassword: {
    type: String,
    required: [true, "password confirmation is required"],
    validate: {
      // This runs only on initial document creation (save and create only)
      validator: function (val: string): boolean {
        return val === (this as UserDocument).password;
      },
      message: "password and password confirmation doesn't match",
    },
  },

  photo: {
    type: String,
    default: "profile-dp.webp",
  },
});

// Methods
userSchema.methods.verifyPassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcyrpt.compare(candidatePassword, this.password);
};

// Pre save hooks
userSchema.pre("save", async function (next: () => void): Promise<void> {
  // if password is not modified, skip this hook and proceed
  if (!this.isModified("password")) {
    next();
    return;
  }

  // hash the password and store in the processing document
  this.password = await bcyrpt.hash(this.password, 12);

  // delete confirmPassword field
  this.confirmPassword = undefined;

  next();
});

const User: Model<UserDocument> = model("User", userSchema);

export default User;
