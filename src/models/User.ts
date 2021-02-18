import crypto from "crypto";
import bcyrpt from "bcrypt";
import { Schema, model } from "mongoose";

const userSchema: Schema<UserDocument, UserModel> = new Schema<
  UserDocument,
  UserModel
>({
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
  tours: [
    {
      type: Schema.Types.ObjectId,
      ref: "Tour",
    },
  ],

  userType: {
    type: String,
    enum: {
      values: ["user", "moderator", "admin"],
      message: "user type must be either 'user', 'moderator' or 'admin'",
    },
    default: "user",
  },

  confirmPassword: {
    type: String,
    required: [true, "password confirmation is required"],
    validate: {
      // This runs only on initial document creation (save and create only)
      validator: function (this: UserDocument, val: string): boolean {
        return val === this.password;
      },
      message: "password and password confirmation doesn't match",
    },
  },

  photo: {
    type: String,
    default: "profile-dp.webp",
  },

  changedPasswordAt: {
    type: Date,
    select: false,
  },

  passwordResetToken: {
    type: String,
    select: false,
  },
  resetTokenExpiresAt: {
    type: Number,
    select: false,
  },
});

// Methods
userSchema.methods.verifyPassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcyrpt.compare(candidatePassword, this.password);
};

userSchema.methods.hasChangedPassword = function (expAt: number): boolean {
  if (this.changedPasswordAt) {
    return this.changedPasswordAt.getTime() / 1000 > expAt;
  }
  return false;
};

userSchema.methods.getPasswordResetToken = function (): string {
  // Generate a plain string token
  const token: string = crypto.randomBytes(32).toString("hex");

  // Hash the token
  const hashedToken: string = crypto
    .createHash("SHA256")
    .update(token)
    .digest("hex");

  // Store the token in database
  this.passwordResetToken = hashedToken;

  // set the password reset token expire data
  this.resetTokenExpiresAt = Date.now() + 10 * 60 * 1000;

  return token;
};

// Static Methods
userSchema.statics.generateHashedToken = function (token: string): string {
  return crypto.createHash("SHA256").update(token).digest("hex");
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

  // set the password update date
  this.changedPasswordAt = new Date();

  // delete confirmPassword field
  this.confirmPassword = undefined;

  next();
});

const User: UserModel = model<UserDocument, UserModel>("User", userSchema);

export default User;
