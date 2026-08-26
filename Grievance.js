import Grievance from "../models/Grievance.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import { analyzeGrievance as analyzeGrievanceWithAI } from "../services/aiService.js";
import { findDuplicateGrievances } from "../services/duplicateService.js";

const generateGrievanceId = () => {
  const random = Math.floor(1000 + Math.random() * 9000);

  return `GRV-${Date.now()}-${random}`;
};

// ============================================================
// CREATE GRIEVANCE
// POST /api/grievances
// ============================================================

export const createGrievance = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      location,
      evidence,
      duplicateMatches,
      aiAnalysis: providedAiAnalysis,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const grievance = await Grievance.create({
      grievanceId: generateGrievanceId(),

      citizen: req.user._id,

      title,
      description,
      category,
      subcategory,
      location,
      evidence,

      status: "SUBMITTED",
      priority: "MEDIUM",
      duplicateMatches: Array.isArray(duplicateMatches)
        ? duplicateMatches
        : [],

      timeline: [
        {
          status: "SUBMITTED",
          message: "Grievance submitted successfully",
          actor: req.user._id,
        },
      ],
    });
    try {
  const aiAnalysis = providedAiAnalysis || await analyzeGrievance({
    title: grievance.title,
    description: grievance.description,
    category: grievance.category,
    subcategory: grievance.subcategory,
    location: grievance.location,
  });

  grievance.aiAnalysis = {
    category: aiAnalysis.category,
    subcategory: aiAnalysis.subcategory,
    department: aiAnalysis.department,
    priorityScore: aiAnalysis.priorityScore,
    priorityReason: aiAnalysis.priorityReason,
    confidence: aiAnalysis.confidence,
    summary: aiAnalysis.summary,
  };

  if (aiAnalysis.priorityScore != null) {
    grievance.priority =
      aiAnalysis.priorityScore >= 85
        ? "CRITICAL"
        : aiAnalysis.priorityScore >= 70
          ? "HIGH"
          : aiAnalysis.priorityScore >= 40
            ? "MEDIUM"
            : "LOW";
  }

  await grievance.save();

  console.log("AI grievance analysis completed");
} catch (aiError) {
  console.error("AI analysis skipped:", aiError.message);
}

    res.status(201).json({
      success: true,
      message: "Grievance created successfully",
      grievance,
    });
  } catch (error) {
    console.error("Create grievance error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating grievance",
    });
  }
};

// ============================================================
// GET MY GRIEVANCES
// GET /api/grievances
// ============================================================

export const getMyGrievances = async (req, res) => {
  try {
    const grievances = await Grievance.find({
      citizen: req.user._id,
    })
      .populate("department", "name code")
      .populate("assignedOfficer", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: grievances.length,
      grievances,
    });
  } catch (error) {
    console.error("Get grievances error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching grievances",
    });
  }
};

// ============================================================
// GET GRIEVANCE BY ID
// GET /api/grievances/:id
// ============================================================

export const getGrievanceById = async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate("citizen", "name email phone")
      .populate("department", "name code")
      .populate("assignedOfficer", "name email");

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    // Citizens can only view their own grievances.
    if (
      req.user.role === "CITIZEN" &&
      grievance.citizen._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this grievance",
      });
    }

    res.json({
      success: true,
      grievance,
    });
  } catch (error) {
    console.error("Get grievance error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching grievance",
    });
  }
};



// ============================================================
// UPDATE GRIEVANCE STATUS
// PATCH /api/grievances/:id/status
// ============================================================

export const updateGrievanceStatus = async (req, res) => {
  try {
    const { status, message } = req.body;

    const allowedStatuses = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
      "REJECTED",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grievance status",
      });
    }

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    grievance.status = status;

    grievance.timeline.push({
      status,
      message:
        message || `Grievance status changed to ${status}`,
      actor: req.user._id,
    });

    // Store resolution information when grievance is resolved.
    if (status === "RESOLVED") {
      grievance.resolution = {
        ...grievance.resolution,
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
      };
    }

    await grievance.save();

    res.json({
      success: true,
      message: "Grievance status updated successfully",
      grievance,
    });
  } catch (error) {
    console.error("Update grievance status error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating grievance status",
    });
  }
};

// ============================================================
// ASSIGN GRIEVANCE
// POST /api/grievances/:id/assign
// ============================================================

export const assignGrievance = async (req, res) => {
  try {
    const { officerId, departmentId } = req.body;

    if (!officerId) {
      return res.status(400).json({
        success: false,
        message: "Officer ID is required",
      });
    }

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    grievance.assignedOfficer = officerId;

    if (departmentId) {
      grievance.department = departmentId;
    }

    grievance.status = "ASSIGNED";

    grievance.timeline.push({
      status: "ASSIGNED",
      message: "Grievance assigned to an officer",
      actor: req.user._id,
    });

    await grievance.save();

    const updatedGrievance = await Grievance.findById(
      grievance._id
    )
      .populate("assignedOfficer", "name email role")
      .populate("department", "name code");

    res.json({
      success: true,
      message: "Grievance assigned successfully",
      grievance: updatedGrievance,
    });
  } catch (error) {
    console.error("Assign grievance error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while assigning grievance",
    });
  }
};

// ============================================================
// ESCALATE GRIEVANCE
// POST /api/grievances/:id/escalate
// ============================================================

export const escalateGrievance = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Escalation reason is required",
      });
    }

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    grievance.sla.escalated = true;

    grievance.timeline.push({
      status: grievance.status,
      message: `Grievance escalated: ${reason}`,
      actor: req.user._id,
    });

    await grievance.save();

    res.json({
      success: true,
      message: "Grievance escalated successfully",
      grievance,
    });
  } catch (error) {
    console.error("Escalate grievance error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while escalating grievance",
    });
  }
};

// ============================================================
// REOPEN GRIEVANCE
// POST /api/grievances/:id/reopen
// ============================================================

export const reopenGrievance = async (req, res) => {
  try {
    const { reason } = req.body;

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    // If citizen is reopening, make sure it is their grievance.
    if (
      req.user.role === "CITIZEN" &&
      grievance.citizen.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only reopen your own grievance",
      });
    }

    grievance.status = "REOPENED";

    grievance.timeline.push({
      status: "REOPENED",
      message: reason || "Grievance reopened",
      actor: req.user._id,
    });

    await grievance.save();

    res.json({
      success: true,
      message: "Grievance reopened successfully",
      grievance,
    });
  } catch (error) {
    console.error("Reopen grievance error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while reopening grievance",
    });
  }
};

// ============================================================
// SUBMIT FEEDBACK
// POST /api/grievances/:id/feedback
// ============================================================

export const submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    // Citizens can only review their own grievances.
    if (
      grievance.citizen.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own grievance",
      });
    }

    grievance.feedback = {
      rating,
      comment,
      submittedAt: new Date(),
    };

    await grievance.save();

    res.json({
      success: true,
      message: "Feedback submitted successfully",
      feedback: grievance.feedback,
    });
  } catch (error) {
    console.error("Feedback error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while submitting feedback",
    });
  }
};
export const analyzeGrievancePreview = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      location,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const aiAnalysis = await analyzeGrievanceWithAI({
      title,
      description,
      category,
      subcategory,
      location,
    });
    return res.json({
      success: true,
      aiAnalysis,
    });
  } catch (error) {
    console.error("AI grievance analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "AI analysis failed",
    });
  }
};
export const checkDuplicateGrievances = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      location,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const query = {
      status: {
        $nin: ["REJECTED", "CANCELLED"],
      },
    };

    if (category) {
      query.category = category;
    }

    if (subcategory) {
      query.subcategory = subcategory;
    }

    const existingGrievances = await Grievance.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "_id title description category subcategory location"
      )
      .lean();

    const newGrievance = {
      title,
      description,
      category: category || "",
      subcategory: subcategory || "",
      location: {
        city: location?.city || "",
        state: location?.state || "",
      },
    };

    const matches = await findDuplicateGrievances(
      newGrievance,
      existingGrievances
    );

    const duplicateMatches = matches
      .filter(
        (match) =>
          match.similarity >= 0.75 &&
          existingGrievances.some(
            (g) => g._id.toString() === match.grievanceId
          )
      )
      .map((match) => {
        const grievance = existingGrievances.find(
          (item) => item._id.toString() === match.grievanceId
        );

        return {
          grievance: match.grievanceId,
          title: grievance?.title || "Similar grievance",
          description: grievance?.description || "",
          category: grievance?.category || "",
          subcategory: grievance?.subcategory || "",
          similarity: match.similarity,
        };
      });

    return res.json({
      success: true,
      hasDuplicates: duplicateMatches.length > 0,
      duplicateMatches,
    });
  } catch (error) {
    console.error("Duplicate grievance check error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check for duplicate grievances",
    });
  }
};