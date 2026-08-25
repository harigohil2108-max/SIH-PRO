import mongoose from "mongoose";

const authorizedIdentitySchema = new mongoose.Schema(
  {
    officialId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["OFFICER", "ADMIN"],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const AuthorizedIdentity = mongoose.model(
  "AuthorizedIdentity",
  authorizedIdentitySchema
);

export default AuthorizedIdentity;