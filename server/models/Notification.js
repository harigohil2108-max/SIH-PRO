import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "GRIEVANCE_SUBMITTED",
        "GRIEVANCE_ASSIGNED",
        "STATUS_UPDATE",
        "GRIEVANCE_RESOLVED",
        "GRIEVANCE_REOPENED",
        "SLA_ALERT",
        "ESCALATION",
        "SYSTEM",
      ],
      default: "SYSTEM",
    },

    read: {
      type: Boolean,
      default: false,
    },

    relatedGrievance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grievance",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;