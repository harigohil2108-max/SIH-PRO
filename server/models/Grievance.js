import mongoose from "mongoose";

const grievanceSchema = new mongoose.Schema(
  {
    grievanceId: {
      type: String,
      unique: true,
      required: true,
    },

    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
    },

    subcategory: {
      type: String,
      trim: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "SUBMITTED",
        "UNDER_REVIEW",
        "ASSIGNED",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
        "REOPENED",
        "REJECTED",
      ],
      default: "SUBMITTED",
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    location: {
      address: String,
      city: String,
      district: String,
      state: String,

      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    evidence: [
      {
        url: String,
        type: {
          type: String,
          enum: ["IMAGE", "VIDEO", "DOCUMENT"],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    aiAnalysis: {
      category: String,
      subcategory: String,
      department: String,

      priorityScore: {
        type: Number,
        min: 0,
        max: 100,
      },

      priorityReason: String,

      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
    },

    duplicateMatches: [
      {
        grievance: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Grievance",
        },

        similarity: {
          type: Number,
          min: 0,
          max: 1,
        },
      },
    ],

    sla: {
      dueAt: Date,

      breached: {
        type: Boolean,
        default: false,
      },

      escalated: {
        type: Boolean,
        default: false,
      },
    },

    timeline: [
      {
        status: String,

        message: String,

        actor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    resolution: {
      message: String,
      evidence: [String],
      resolvedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },

      comment: String,

      submittedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Grievance = mongoose.model("Grievance", grievanceSchema);

export default Grievance;