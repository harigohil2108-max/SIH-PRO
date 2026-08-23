import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

          role: {
        type: String,
        enum: ["CITIZEN", "OFFICER", "ADMIN"],
        default: "CITIZEN",
      },

      officialId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
      },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    designation: {
      type: String,
      trim: true,
    },

    preferredLanguage: {
      type: String,
      default: "en",
    },

    location: {
      city: String,
      district: String,
      state: String,
      pincode: String,
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

const User = mongoose.model("User", userSchema);

export default User;